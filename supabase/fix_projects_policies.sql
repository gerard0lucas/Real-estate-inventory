-- Fix Projects RLS Policies to allow agents to create/update/delete projects
-- Run this in your Supabase SQL Editor

-- Drop old policies
DROP POLICY IF EXISTS "Admins can insert projects." ON projects;
DROP POLICY IF EXISTS "Admins can update projects." ON projects;
DROP POLICY IF EXISTS "Admins can delete projects." ON projects;

-- Allow authenticated users (admins and agents) to insert projects
CREATE POLICY "Authenticated users can insert projects."
  ON projects FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to update projects they created
CREATE POLICY "Users can update projects they created."
  ON projects FOR UPDATE
  USING (created_by = auth.uid());

-- Allow admins to update any project
CREATE POLICY "Admins can update any project."
  ON projects FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow users to delete projects they created
CREATE POLICY "Users can delete projects they created."
  ON projects FOR DELETE
  USING (created_by = auth.uid());

-- Allow admins to delete any project
CREATE POLICY "Admins can delete any project."
  ON projects FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

