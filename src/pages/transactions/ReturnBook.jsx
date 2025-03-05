import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function ReturnBook() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    actual_return_date: formattedToday
  });
  
  useEffect(() => {
    fetchBorrowedBooks();
  }, []);

  const fetchBorrowedBooks = async () => {
    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          books (
            id,
            title,
            author,
            serial_number,
            type
          )
        `)
        .eq('status', 'issued')
        .eq('user_id', userData.user.id);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      toast.error('Error fetching borrowed books: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      actual_return_date: formattedToday
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateFine = (returnDate, expectedReturnDate) => {
    const actualDate = new Date(returnDate);
    const expectedDate = new Date(expectedReturnDate);
    
    if (actualDate <= expectedDate) return 0;
    
    const daysLate = differenceInDays(actualDate, expectedDate);
    // $1 per day fine
    return daysLate * 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTransaction) {
      return toast.error('Please select a book to return');
    }

    try {
      setLoading(true);
      
      // Calculate fine if any
      const fine = calculateFine(
        formData.actual_return_date, 
        selectedTransaction.expected_return_date
      );
      
      // Update the transaction with return details
      const { error: transactionError } = await supabase
        .from('transactions')
        .update({
          actual_return_date: formData.actual_return_date,
          fine_amount: fine,
          status: 'returned'
        })
        .eq('id', selectedTransaction.id);

      if (transactionError) throw transactionError;

      // Update book availability
      const { error: bookError } = await supabase
        .from('books')
        .update({ available: true })
        .eq('id', selectedTransaction.books.id);

      if (bookError) throw bookError;

      toast.success('Book returned successfully');
      
      // Navigate to pay fine if there is a fine
      if (fine > 0) {
        navigate(`/transactions/pay-fine/${selectedTransaction.id}`);
      } else {
        navigate('/transactions');
      }
    } catch (error) {
      toast.error('Error returning book: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Return Book</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Borrowed Books</h2>
            {loading ? (
              <div>Loading...</div>
            ) : (
              <div className="overflow-auto max-h-96">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Issue Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {transactions.map(transaction => (
                      <tr key={transaction.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{transaction.books.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{transaction.books.serial_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(transaction.issue_date), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="selectedTransaction"
                            checked={selectedTransaction?.id === transaction.id}
                            onChange={() => handleSelectTransaction(transaction)}
                          />
                        </td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center">
                          No borrowed books found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Return Details</h2>
            {selectedTransaction ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Title</label>
                  <input
                    type="text"
                    value={selectedTransaction.books.title}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    value={selectedTransaction.books.author}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input
                    type="text"
                    value={selectedTransaction.books.serial_number}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                  <input
                    type="date"
                    value={format(new Date(selectedTransaction.issue_date), 'yyyy-MM-dd')}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Return Date</label>
                  <input
                    type="date"
                    value={format(new Date(selectedTransaction.expected_return_date), 'yyyy-MM-dd')}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Actual Return Date *</label>
                  <input
                    type="date"
                    name="actual_return_date"
                    value={formData.actual_return_date}
                    onChange={handleChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Estimated Fine
                  </label>
                  <div className="mt-1 font-semibold text-red-600">
                    ${calculateFine(formData.actual_return_date, selectedTransaction.expected_return_date).toFixed(2)}
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Confirm Return'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/transactions')}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Please select a book from the list to proceed
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}