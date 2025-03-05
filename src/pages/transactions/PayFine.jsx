// src/pages/transactions/PayFine.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function PayFine() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState(null);
  const [formData, setFormData] = useState({
    fine_paid: false,
    remarks: ''
  });

  useEffect(() => {
    fetchTransactionDetails();
  }, [id]);

  const fetchTransactionDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          books (
            id,
            title,
            author,
            serial_number
          ),
          users (
            name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTransaction(data);
      setFormData({
        fine_paid: data.fine_paid || false,
        remarks: data.remarks || ''
      });
    } catch (error) {
      toast.error('Error fetching transaction details: ' + error.message);
      navigate('/transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that fine is paid if there is any fine amount
    if (transaction.fine_amount > 0 && !formData.fine_paid) {
      return toast.error('Please confirm payment of the fine to complete the transaction.');
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('transactions')
        .update({
          fine_paid: formData.fine_paid,
          remarks: formData.remarks
        })
        .eq('id', id);

      if (error) throw error;

      toast.success('Transaction completed successfully');
      navigate('/transactions');
    } catch (error) {
      toast.error('Error completing transaction: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Pay Fine</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Transaction Details</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-gray-600">Book Title</p>
              <p className="font-medium">{transaction.books.title}</p>
            </div>
            <div>
              <p className="text-gray-600">Author</p>
              <p className="font-medium">{transaction.books.author}</p>
            </div>
            <div>
              <p className="text-gray-600">Serial Number</p>
              <p className="font-medium">{transaction.books.serial_number}</p>
            </div>
            <div>
              <p className="text-gray-600">User</p>
              <p className="font-medium">{transaction.users.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Issue Date</p>
              <p className="font-medium">{format(new Date(transaction.issue_date), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-gray-600">Return Date</p>
              <p className="font-medium">{format(new Date(transaction.actual_return_date), 'MMM d, yyyy')}</p>
            </div>
          </div>

          <div className="border-t pt-4 mb-4">
            <div className="flex justify-between items-center">
              <p className="text-gray-600 text-lg">Fine Amount:</p>
              <p className="font-bold text-lg text-red-600">
                ${parseFloat(transaction.fine_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {parseFloat(transaction.fine_amount) > 0 && (
            <div className="mb-4">
              <label className="inline-flex items-center">
                <input
                  type="checkbox"
                  name="fine_paid"
                  checked={formData.fine_paid}
                  onChange={handleChange}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="ml-2 text-gray-700">Fine Paid</span>
              </label>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Remarks
            </label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="3"
            ></textarea>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm'}
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
      </div>
    </div>
  );
}