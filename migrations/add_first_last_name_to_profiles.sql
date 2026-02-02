-- Migration: Add first_name and last_name columns to profiles table
-- Run this in your Supabase SQL editor

-- Add first_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN first_name TEXT;
  END IF;
END $$;

-- Add last_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN last_name TEXT;
  END IF;
END $$;







