-- Add new columns to support the ProjectInfo modal

-- 1. Add columns to the 'projects' table
ALTER TABLE public.projects
ADD COLUMN contact_history TEXT NULL,
ADD COLUMN youtube_link TEXT NULL;

-- 2. Add a column to the 'user_profiles' table
ALTER TABLE public.user_profiles
ADD COLUMN info TEXT NULL;
