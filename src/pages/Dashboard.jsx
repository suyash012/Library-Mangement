import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import BookList from './books/BookList';
import BookForm from './books/BookForm';
import UserManagement from './maintenance/UserManagement';
import TransactionReport from './reports/TransactionReport';
import IssueBook from './transactions/IssueBook';
import ReturnBook from './transactions/ReturnBook';
import PayFine from './transactions/PayFine';
import AddMembership from './membership/AddMembership';
import UpdateMembership from './membership/UpdateMembership';
import Home from './Home';

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .single();

          if (error) throw error;
          setUserRole(data?.role || 'user');
        } catch (error) {
          console.error('Error fetching user role:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold">Library System</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  to="/"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/books"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Books
                </Link>
                <Link
                  to="/memberships"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Memberships
                </Link>
                <Link
                  to="/transactions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Transactions
                </Link>
                <Link
                  to="/reports/transactions"
                  className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Reports
                </Link>
                {userRole === 'admin' && (
                  <Link
                    to="/maintenance/users"
                    className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Maintenance
                  </Link>
                )}
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-500">
                {user?.email} ({userRole})
              </span>
              <button
                onClick={handleSignOut}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/books" element={<BookList />} />
          <Route path="/books/add" element={<BookForm />} />
          <Route path="/books/edit/:id" element={<BookForm />} />
          
          {/* Transactions */}
          <Route path="/transactions" element={<div className="flex flex-col space-y-4">
            <h1 className="text-2xl font-bold">Transactions</h1>
            <div className="flex space-x-4">
              <Link to="/transactions/issue" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Issue Book
              </Link>
              <Link to="/transactions/return" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Return Book
              </Link>
            </div>
          </div>} />
          <Route path="/transactions/issue" element={<IssueBook />} />
          <Route path="/transactions/return" element={<ReturnBook />} />
          <Route path="/transactions/pay-fine/:id" element={<PayFine />} />
          
          {/* Memberships */}
          <Route path="/memberships" element={<div className="flex flex-col space-y-4">
            <h1 className="text-2xl font-bold">Memberships</h1>
            <div className="flex space-x-4">
              <Link to="/memberships/add" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Add Membership
              </Link>
              <Link to="/memberships/update" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                Update Membership
              </Link>
            </div>
          </div>} />
          <Route path="/memberships/add" element={<AddMembership />} />
          <Route path="/memberships/update" element={<UpdateMembership />} />
          
          {/* Reports */}
          <Route path="/reports/transactions" element={<TransactionReport />} />
          
          {/* Maintenance - only accessible to admin */}
          <Route 
            path="/maintenance/*" 
            element={
              userRole === 'admin' ? 
                <Routes>
                  <Route path="users" element={<UserManagement />} />
                </Routes> : 
                <Navigate to="/" replace />
            } 
          />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}