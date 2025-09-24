CREATE OR REPLACE FUNCTION public.get_available_slots()
RETURNS TABLE (
    id bigint,
    slot_time timestamptz,
    is_open boolean,
    booking_status text,
    project_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ts.id,
        ts.slot_time,
        ts.is_open,
        ts.booking_status,
        ts.project_id
    FROM
        public.time_slots ts
    WHERE
        ts.is_open = true AND ts.booking_status = 'available'
    ORDER BY
        ts.slot_time ASC;
END;
$$;

COMMENT ON FUNCTION public.get_available_slots() IS 'Fetches all time slots that are open and available for booking by any authenticated user.';
