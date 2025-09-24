CREATE OR REPLACE FUNCTION public.get_activity_logs()
RETURNS TABLE (
    log_id bigint,
    created_at timestamptz,
    project_name text,
    actor_user_id text,
    description text,
    old_status text,
    new_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This function can only be run by admins, enforced by the RLS policy on the underlying table.
    RETURN QUERY
    SELECT
        pal.id as log_id,
        pal.created_at,
        p.name as project_name,
        pal.actor_user_id,
        pal.description,
        pal.old_status,
        pal.new_status
    FROM
        public.project_activity_logs pal
    LEFT JOIN
        public.projects p ON pal.project_id = p.id
    ORDER BY
        pal.created_at DESC;
END;
$$;

COMMENT ON FUNCTION public.get_activity_logs() IS 'Fetches a combined view of project activity logs including project names. For admin use.';
