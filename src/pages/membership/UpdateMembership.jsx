// src/pages/membership/UpdateMembership.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { format, addMonths } from 'date-fns';
import toast from 'react-hot-toast';

export default function UpdateMembership() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [memberships, setMemberships] = useState([]);
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [membershipNumber, setMembershipNumber] = useState('');
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');

  const [formData, setFormData] = useState({
    duration: '6', // Default to 6 months
    action: 'extend' // Default to extend
  });

  const fetchMembership = async () => {
    if (!membershipNumber.trim()) {
      return toast.error('Please enter a membership number');
    }

    try {
      setSearchLoading(true);
      
      const { data, error } = await supabase
        .from('memberships')
        .select(`
          *,
          users (
            name,
            email
          )
        `)
        .eq('membership_number', membershipNumber.trim())
        .single();

      if (error) throw error;
      
      if (data) {
        setSelectedMembership(data);
        setFormData({
          ...formData,
          start_date: format(new Date(data.end_date), 'yyyy-MM-dd')
        });
      }
    } catch (error) {
      toast.error('Error finding membership: ' + error.message);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const calculateNewEndDate = () => {
    if (!selectedMembership) return '';
    
    const startDate = new Date(formData.start_date || selectedMembership.end_date);
    const months = parseInt(formData.duration);
    return format(addMonths(startDate, months), 'yyyy-MM-dd');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedMembership) {
      return toast.error('Please select a membership first');
    }

    try {
      setLoading(true);
      
      if (formData.action === 'extend') {
        const newEndDate = calculateNewEndDate();
        
        const { error } = await supabase
          .from('memberships')
          .update({
            end_date: newEndDate,
            status: 'active'
          })
          .eq('id', selectedMembership.id);

        if (error) throw error;
        toast.success('Membership extended successfully');
      } else if (formData.action === 'cancel') {
        const { error } = await supabase
          .from('memberships')
          .update({
            status: 'cancelled'
          })
          .eq('id', selectedMembership.id);

        if (error) throw error;
        toast.success('Membership cancelled successfully');
      }
      
      navigate('/memberships');
    } catch (error) {
      toast.error('Error updating membership: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Update Membership</h1>

      <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto mb-8">
        <div className="flex mb-4">
          <input
            type="text"
            value={membershipNumber}
            onChange={(e) => setMembershipNumber(e.target.value)}
            placeholder="Enter Membership Number"
            className="flex-1 border rounded-l px-4 py-2"
          />
          <button
            onClick={fetchMembership}
            disabled={searchLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600 disabled:opacity-50"
          >
            {searchLoading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {selectedMembership && (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Membership Details</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-gray-600">Member</p>
                <p className="font-medium">{selectedMembership.users.name}</p>
              </div>
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{selectedMembership.users.email}</p>
              </div>
              <div>
                <p className="text-gray-600">Membership Number</p>
                <p className="font-medium">{selectedMembership.membership_number}</p>
              </div>
              <div>
                <p className="text-gray-600">Status</p>
                <p className={`font-medium ${
                  selectedMembership.status === 'active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedMembership.status.charAt(0).toUpperCase() + selectedMembership.status.slice(1)}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Start Date</p>
                <p className="font-medium">{format(new Date(selectedMembership.start_date), 'MMM d, yyyy')}</p>
              </div>
              <div>
                <p className="text-gray-600">End Date</p>
                <p className="font-medium">{format(new Date(selectedMembership.end_date), 'MMM d, yyyy')}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Action
              </label>
              <div className="mt-2 space-x-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="extend"
                    checked={formData.action === 'extend'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Extend Membership</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="action"
                    value="cancel"
                    checked={formData.action === 'cancel'}
                    onChange={handleChange}
                    className="form-radio"
                  />
                  <span className="ml-2">Cancel Membership</span>
                </label>
              </div>
            </div>

            {formData.action === 'extend' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Duration
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
                    New End Date
                  </label>
                  <input
                    type="date"
                    value={calculateNewEndDate()}
                    className="mt-1 block w-full bg-gray-100 rounded-md border-gray-300 shadow-sm"
                    disabled
                  />
                </div>
              </>
            )}

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
              >
                {loading ? 'Processing...' : formData.action === 'extend' ? 'Extend Membership' : 'Cancel Membership'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/memberships')}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Go Back
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}