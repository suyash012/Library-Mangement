// src/pages/membership/AddMembership.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

export default function AddMembership() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    membership_number: generateMembershipNumber(),
    start_date: formattedToday,
    duration: '6', // Default to 6 months
    status: 'active'
  });

  // Generate a unique membership number
  function generateMembershipNumber() {
    const prefix = 'MEM';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${timestamp}-${random}`;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateEndDate = () => {
    const startDate = new Date(formData.start_date);
    const months = parseInt(formData.duration);
    return format(addMonths(startDate, months), 'yyyy-MM-dd');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.membership_number || !formData.start_date || !formData.duration) {
      return toast.error('Please fill in all required fields');
    }

    try {
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      const end_date = calculateEndDate();
      
      const { error } = await supabase
        .from('memberships')
        .insert([{
          user_id: userData.user.id,
          membership_number: formData.membership_number,
          start_date: formData.start_date,
          end_date,
          status: formData.status
        }]);

      if (error) throw error;

      toast.success('Membership added successfully');
      navigate('/memberships');
    } catch (error) {
      toast.error('Error adding membership: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Membership</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Membership Number *
            </label>
            <input
              type="text"
              name="membership_number"
              value={formData.membership_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date *
            </label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
              min={formattedToday}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Duration *
            </label>
            <div className="mt-2 space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value="6"
                  checked={formData.duration === '6'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">6 Months</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value="12"
                  checked={formData.duration === '12'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">1 Year</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="duration"
                  value="24"
                  checked={formData.duration === '24'}
                  onChange={handleChange}
                  className="form-radio"
                />
                <span className="ml-2">2 Years</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={calculateEndDate()}
              className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
              disabled
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Add Membership'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/memberships')}
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