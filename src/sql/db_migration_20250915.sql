-- 1. Create the ENUM type for project status
CREATE TYPE public.project_status AS ENUM (
    'project_open', -- project open, account not given by user
    'script_needed', -- if user logined or enter script_editor, status changed
    'script_submitted', -- request script from user
    'schedule_submitted', -- request schedule from user
    'schedule_under_review', -- schedule under review by admin
    'schedule_fixed', -- schedule fixed by admin and user
    'shoot_completed', -- shoot completed
    'video_draft_1', -- video draft no.1
    'feedback_complete',
    'video_edit_uploaded', -- video under edit is uploaded
    'project_complete', -- project finished
    'project_pending', -- project pending
    'project_cancled' -- project cancle
);

-- 2. Alter the 'projects' table to use the new type
-- First, drop the old default value
ALTER TABLE public.projects
ALTER COLUMN status DROP DEFAULT;

-- Second, change the column type, casting existing values to the new type
ALTER TABLE public.projects
ALTER COLUMN status TYPE public.project_status
USING status::public.project_status;

-- Finally, set the new default value using the ENUM
ALTER TABLE public.projects
ALTER COLUMN status SET DEFAULT 'proejct_open';
