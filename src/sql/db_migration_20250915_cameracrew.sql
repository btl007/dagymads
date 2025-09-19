-- Add camera_crew column to projects table

ALTER TABLE public.projects
ADD COLUMN camera_crew TEXT NULL;
