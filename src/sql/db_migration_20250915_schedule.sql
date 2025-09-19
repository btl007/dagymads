-- Add require_schedule column to projects table

ALTER TABLE public.projects
ADD COLUMN require_schedule JSONB NULL;
