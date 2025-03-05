import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, addDays } from 'date-fns';
import toast from 'react-hot-toast';

export default function IssueBook() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [books, setBooks] = useState([]);
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    book_id: '',
    issue_date: formattedToday,
    return_date: format(addDays(today, 15), 'yyyy-MM-dd'),
    remarks: ''
  });

  useEffect(() => {
    fetchAvailableBooks();
  }, []);

  const fetchAvailableBooks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('books')
        .select('*')
        .eq('available', true);

      if (error) throw error;
      setBooks(data || []);
      setFilteredBooks(data || []);
    } catch (error) {
      toast.error('Error fetching books: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredBooks(books);
      return;
    }

    const filtered = books.filter(
      book =>
        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        book.serial_number.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBooks(filtered);
  };

  const handleSelectBook = (book) => {
    setSelectedBook(book);
    setFormData({
      ...formData,
      book_id: book.id
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Validate return date not more than 15 days from issue date
    if (name === 'return_date') {
      const issueDate = new Date(formData.issue_date);
      const returnDate = new Date(value);
      const maxReturnDate = addDays(issueDate, 15);
      
      if (returnDate > maxReturnDate) {
        toast.error('Return date cannot be more than 15 days from issue date');
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBook) {
      return toast.error('Please select a book to issue');
    }

    if (!formData.issue_date || !formData.return_date) {
      return toast.error('Please fill all required fields');
    }

    // Validate issue date not less than today
    const issueDate = new Date(formData.issue_date);
    if (issueDate < new Date(formattedToday)) {
      return toast.error('Issue date cannot be earlier than today');
    }

    try {
      setLoading(true);
      
      // Get the current authenticated user
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      
      // First, make sure this user exists in the users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single();
        
      if (userError || !userData) {
        // User doesn't exist in users table, let's create one
        const { error: insertError } = await supabase
          .from('users')
          .insert([{
            id: authData.user.id,
            email: authData.user.email,
            name: authData.user.email.split('@')[0], // Fallback name
            role: 'user'
          }]);
          
        if (insertError) throw insertError;
        toast.success('User profile created automatically');
      }
      
      // Create transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert([{
          book_id: selectedBook.id,
          user_id: authData.user.id,
          issue_date: formData.issue_date,
          expected_return_date: formData.return_date,
          remarks: formData.remarks,
          status: 'issued'
        }]);

      if (transactionError) throw transactionError;

      // Update book availability
      const { error: bookError } = await supabase
        .from('books')
        .update({ available: false })
        .eq('id', selectedBook.id);

      if (bookError) throw bookError;

      toast.success('Book issued successfully');
      navigate('/transactions');
    } catch (error) {
      toast.error('Error issuing book: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Issue Book</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Search Books</h2>
            <div className="flex mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by title, author, or serial number"
                className="flex-1 border rounded-l px-4 py-2"
              />
              <button
                onClick={handleSearch}
                className="bg-blue-500 text-white px-4 py-2 rounded-r"
              >
                Search
              </button>
            </div>
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
                        Author
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Serial Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBooks.map(book => (
                      <tr key={book.id}>
                        <td className="px-6 py-4 whitespace-nowrap">{book.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{book.author}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{book.serial_number}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="radio"
                            name="selectedBook"
                            checked={selectedBook?.id === book.id}
                            onChange={() => handleSelectBook(book)}
                          />
                        </td>
                      </tr>
                    ))}
                    {filteredBooks.length === 0 && (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center">
                          No books found
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
            <h2 className="text-xl font-semibold mb-4">Issue Details</h2>
            {selectedBook ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Book Title</label>
                  <input
                    type="text"
                    value={selectedBook.title}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Author</label>
                  <input
                    type="text"
                    value={selectedBook.author}
                    disabled
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Issue Date *</label>
                  <input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    min={formattedToday}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Return Date *</label>
                  <input
                    type="date"
                    name="return_date"
                    value={formData.return_date}
                    onChange={handleChange}
                    min={formData.issue_date}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleChange}
                    rows="3"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  ></textarea>
                </div>

                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {loading ? 'Processing...' : 'Issue Book'}
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