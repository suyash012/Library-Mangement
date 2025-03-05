/*
  # Complete Library Management System Schema

  1. Tables
    - Users
    - Books
    - Memberships
    - Transactions

  2. Security
    - RLS enabled on all tables
    - Policies for user and admin access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR NOT NULL UNIQUE,
  name VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Books Table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR NOT NULL,
  author VARCHAR NOT NULL,
  serial_number VARCHAR NOT NULL UNIQUE,
  type VARCHAR NOT NULL CHECK (type IN ('book', 'movie')),
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Memberships Table
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  membership_number VARCHAR NOT NULL UNIQUE,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_id UUID NOT NULL REFERENCES books(id),
  user_id UUID NOT NULL REFERENCES users(id),
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expected_return_date TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_return_date TIMESTAMP WITH TIME ZONE,
  fine_amount DECIMAL(10, 2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  remarks VARCHAR,
  status VARCHAR NOT NULL CHECK (status IN ('issued', 'returned')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be causing recursion issues
DROP POLICY IF EXISTS "Allow users to read their own data" ON users;
DROP POLICY IF EXISTS "Allow admin full access to users" ON users;
DROP POLICY IF EXISTS "Allow admin full access to books" ON books;
DROP POLICY IF EXISTS "Allow users to read their own memberships" ON memberships;
DROP POLICY IF EXISTS "Allow admin full access to memberships" ON memberships;
DROP POLICY IF EXISTS "Allow users to read their own transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admin full access to transactions" ON transactions;

-- Recreate the is_admin function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  ) AND auth.role() = 'authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate policies correctly
CREATE POLICY "Allow users to read their own data"
  ON users FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR is_admin());

CREATE POLICY "Allow admin full access to users"
  ON users FOR ALL
  TO authenticated
  USING (is_admin());

-- Recreate other policies that depend on is_admin()
CREATE POLICY "Allow admin full access to books"
  ON books FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Allow users to read their own memberships"
  ON memberships FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Allow admin full access to memberships"
  ON memberships FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Allow users to read their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Allow admin full access to transactions"
  ON transactions FOR ALL
  TO authenticated
  USING (is_admin());

CREATE POLICY "Allow users to create their own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());