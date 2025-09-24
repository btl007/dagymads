CREATE OR REPLACE FUNCTION public.get_pending_requests()
RETURNS TABLE (
    slot_id bigint,
    slot_time timestamp with time zone,
    project_id uuid,
    project_name text,
    user_id text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ts.id as slot_id,
        ts.slot_time as slot_time,
        p.id as project_id,
        p.name as project_name,
        p.user_id
    FROM
        public.time_slots ts
    JOIN
        public.projects p ON ts.project_id = p.id
    WHERE
        ts.booking_status = 'requested'
    ORDER BY
        ts.slot_time ASC;
END;
$$;

COMMENT ON FUNCTION public.get_pending_requests() IS 'Fetches all time slots with a booking_status of ''requested'' along with their associated project and user information.';