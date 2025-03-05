import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, Navigate, useLocation } from 'react-router-dom';
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

const NavLink = ({ to, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to || 
    (to !== '/' && location.pathname.startsWith(to));
  
  return (
    <Link
      to={to}
      className={`${
        isActive 
          ? 'border-indigo-500 text-indigo-700 font-medium' 
          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
      } inline-flex items-center px-1 pt-1 border-b-2 text-sm transition-colors duration-200`}
    >
      {children}
    </Link>
  );
};

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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <span className="text-xl font-bold text-gray-800">Library MS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <NavLink to="/">Dashboard</NavLink>
                <NavLink to="/books">Books</NavLink>
                <NavLink to="/memberships">Memberships</NavLink>
                <NavLink to="/transactions">Transactions</NavLink>
                <NavLink to="/reports/transactions">Reports</NavLink>
                {userRole === 'admin' && (
                  <NavLink to="/maintenance/users">Maintenance</NavLink>
                )}
                <NavLink to="/help">
                  <div className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    Help
                  </div>
                </NavLink>
              </div>
            </div>
            <div className="flex items-center">
              <span className="mr-4 text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                {user?.email} 
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  userRole === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                }`}>
                  {userRole}
                </span>
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
          <Route path="/transactions" element={
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-6">Transactions</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <div className="p-6 text-white">
                    <div className="text-3xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Issue Book</h2>
                    <p className="mb-4">Issue a new book to a member</p>
                    <Link to="/transactions/issue" className="inline-block px-4 py-2 bg-white text-blue-500 rounded hover:bg-blue-50 transition-colors">
                      Issue Now
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <div className="p-6 text-white">
                    <div className="text-3xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Return Book</h2>
                    <p className="mb-4">Process a book return</p>
                    <Link to="/transactions/return" className="inline-block px-4 py-2 bg-white text-green-500 rounded hover:bg-green-50 transition-colors">
                      Return Book
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <div className="p-6 text-white">
                    <div className="text-3xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">View History</h2>
                    <p className="mb-4">Check transaction history</p>
                    <Link to="/reports/transactions" className="inline-block px-4 py-2 bg-white text-purple-500 rounded hover:bg-purple-50 transition-colors">
                      View Reports
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          } />
          <Route path="/transactions/issue" element={<IssueBook />} />
          <Route path="/transactions/return" element={<ReturnBook />} />
          <Route path="/transactions/pay-fine/:id" element={<PayFine />} />
          
          {/* Memberships */}
          <Route path="/memberships" element={
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-6">Memberships</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <div className="p-6 text-white">
                    <div className="text-3xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Add Membership</h2>
                    <p className="mb-4">Register a new membership</p>
                    <Link to="/memberships/add" className="inline-block px-4 py-2 bg-white text-indigo-500 rounded hover:bg-indigo-50 transition-colors">
                      Add Now
                    </Link>
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg shadow-md overflow-hidden transition-transform hover:scale-105">
                  <div className="p-6 text-white">
                    <div className="text-3xl mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h2 className="text-xl font-semibold mb-2">Update Membership</h2>
                    <p className="mb-4">Modify existing membership</p>
                    <Link to="/memberships/update" className="inline-block px-4 py-2 bg-white text-amber-500 rounded hover:bg-amber-50 transition-colors">
                      Update Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          } />
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
          
          {/* Help */}
          <Route path="/help" element={
            <div className="p-6 bg-white rounded-lg shadow-md">
              <h1 className="text-2xl font-bold mb-6">System Flow Chart</h1>
              <div className="mb-8">
                <p className="text-gray-600 mb-4">This chart shows the overall flow of the Library Management System:</p>
                <div className="bg-gray-50 p-6 rounded-lg border">
                  <div className="flex flex-col items-center">
                    <div className="p-4 bg-blue-100 rounded-lg mb-4 w-64 text-center">Login/Authentication</div>
                    <div className="h-8 border-l-2 border-gray-400"></div>
                    <div className="p-4 bg-green-100 rounded-lg mb-4 w-64 text-center">Dashboard</div>
                    <div className="grid grid-cols-3 gap-8">
                      <div className="flex flex-col items-center">
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="p-4 bg-indigo-100 rounded-lg w-64 text-center">Book Management</div>
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-2 bg-indigo-50 rounded w-28 text-center text-xs">Add Book</div>
                          <div className="p-2 bg-indigo-50 rounded w-28 text-center text-xs">Update Book</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="p-4 bg-purple-100 rounded-lg w-64 text-center">Transactions</div>
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="p-2 bg-purple-50 rounded w-20 text-center text-xs">Issue</div>
                          <div className="p-2 bg-purple-50 rounded w-20 text-center text-xs">Return</div>
                          <div className="p-2 bg-purple-50 rounded w-20 text-center text-xs">Fine</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="p-4 bg-amber-100 rounded-lg w-64 text-center">Memberships</div>
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-2 bg-amber-50 rounded w-28 text-center text-xs">Add</div>
                          <div className="p-2 bg-amber-50 rounded w-28 text-center text-xs">Update</div>
                        </div>
                      </div>
                    </div>
                    {userRole === 'admin' && (
                      <div className="mt-8">
                        <div className="h-8 border-l-2 border-gray-400"></div>
                        <div className="p-4 bg-red-100 rounded-lg w-64 text-center">Admin Maintenance</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          } />
          
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}