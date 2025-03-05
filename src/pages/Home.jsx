// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  BarChart, Bar, PieChart, Pie, LineChart, Line, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { format, subMonths } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Home() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksIssued: 0,
    activeMembers: 0,
    totalFines: 0
  });
  const [bookTypeData, setBookTypeData] = useState([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState([]);
  const [popularBooks, setPopularBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        await Promise.all([
          fetchStats(),
          fetchBookTypeDistribution(),
          fetchMonthlyTransactions(),
          fetchPopularBooks()
        ]);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchDashboardData();
  }, []);

  async function fetchStats() {
    // Get total books count
    const { data: books, error: booksError } = await supabase
      .from('books')
      .select('id', { count: 'exact' });
    
    // Get books currently issued
    const { data: issued, error: issuedError } = await supabase
      .from('books')
      .select('id', { count: 'exact' })
      .eq('available', false);
      
    // Get active members
    const { data: members, error: membersError } = await supabase
      .from('memberships')
      .select('id', { count: 'exact' })
      .eq('status', 'active');

    // Get total fines
    const { data: fines, error: finesError } = await supabase
      .from('transactions')
      .select('fine_amount');
      
    if (booksError || issuedError || membersError || finesError) throw error;
    
    const totalFines = fines?.reduce((sum, transaction) => 
      sum + (transaction.fine_amount || 0), 0) || 0;
    
    setStats({
      totalBooks: books?.length || 0,
      booksIssued: issued?.length || 0,
      activeMembers: members?.length || 0,
      totalFines
    });
  }

  async function fetchBookTypeDistribution() {
    const { data, error } = await supabase
      .from('books')
      .select('type')
      .order('type');
      
    if (error) throw error;
    
    const bookCount = { book: 0, movie: 0 };
    data.forEach(item => {
      bookCount[item.type] += 1;
    });
    
    setBookTypeData([
      { name: 'Books', value: bookCount.book },
      { name: 'Movies', value: bookCount.movie }
    ]);
  }

  async function fetchMonthlyTransactions() {
    // Get transactions for last 6 months
    const sixMonthsAgo = subMonths(new Date(), 6);
    const { data, error } = await supabase
      .from('transactions')
      .select('issue_date, status')
      .gte('issue_date', format(sixMonthsAgo, 'yyyy-MM-dd'));
      
    if (error) throw error;
    
    // Group by month
    const monthlyData = {};
    data.forEach(transaction => {
      const month = format(new Date(transaction.issue_date), 'MMM');
      if (!monthlyData[month]) {
        monthlyData[month] = { month, issued: 0, returned: 0 };
      }
      if (transaction.status === 'issued') {
        monthlyData[month].issued += 1;
      } else if (transaction.status === 'returned') {
        monthlyData[month].returned += 1;
      }
    });
    
    setMonthlyTransactions(Object.values(monthlyData));
  }

  async function fetchPopularBooks() {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        book_id,
        books (
          title
        )
      `)
      .limit(50); // Get enough data for analysis
      
    if (error) throw error;
    
    // Count occurrences of each book
    const bookCounts = {};
    data.forEach(transaction => {
      const bookId = transaction.book_id;
      const title = transaction.books?.title;
      if (title) {
        bookCounts[bookId] = bookCounts[bookId] || { name: title, count: 0 };
        bookCounts[bookId].count += 1;
      }
    });
    
    // Get top 5 books
    const sorted = Object.values(bookCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    setPopularBooks(sorted);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Library Management Dashboard</h1>
        <p className="text-gray-600">Welcome to your library management system</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Books</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalBooks}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Books Issued</p>
              <p className="text-2xl font-bold text-gray-800">{stats.booksIssued}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Active Members</p>
              <p className="text-2xl font-bold text-gray-800">{stats.activeMembers}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-500 mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Total Fines</p>
              <p className="text-2xl font-bold text-gray-800">${stats.totalFines.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Book Type Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Book Type Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={bookTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {bookTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Monthly Transactions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Monthly Transactions</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyTransactions}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issued" fill="#8884d8" name="Books Issued" />
              <Bar dataKey="returned" fill="#82ca9d" name="Books Returned" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        {/* Popular Books */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">Most Popular Books</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={popularBooks}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="name" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0088FE" name="Checkouts" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}