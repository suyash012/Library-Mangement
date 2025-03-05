// src/pages/Home.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export default function Home() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksIssued: 0,
    activeMembers: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
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
          
        if (booksError || issuedError || membersError) throw error;
        
        setStats({
          totalBooks: books.length,
          booksIssued: issued.length,
          activeMembers: members.length
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Welcome to Library Management System</h1>
      
      {loading ? (
        <p>Loading dashboard stats...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Total Books</h2>
            <p className="text-3xl font-bold text-blue-600">{stats.totalBooks}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Books Issued</h2>
            <p className="text-3xl font-bold text-orange-600">{stats.booksIssued}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-2">Active Members</h2>
            <p className="text-3xl font-bold text-green-600">{stats.activeMembers}</p>
          </div>
        </div>
      )}
    </div>
  );
}