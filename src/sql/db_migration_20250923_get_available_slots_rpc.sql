-- 1. Get Available Slots (Security Enhanced)
-- Only returns slots that are OPEN and AVAILABLE.
-- Users cannot see who booked other slots, only that they are unavailable.
CREATE OR REPLACE FUNCTION public.get_available_slots(
  p_start_date date, 
  p_end_date date
)
RETURNS TABLE (
  id bigint,
  slot_time timestamptz,
  is_open boolean,
  booking_status text
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
    ts.booking_status
  FROM public.time_slots ts
  WHERE ts.slot_time::date >= p_start_date
    AND ts.slot_time::date <= p_end_date
    AND ts.is_open = true
    AND ts.booking_status = 'available'
  ORDER BY ts.slot_time ASC;
END;
$$;

-- 2. Request Schedule Slot
-- User selects a slot. Status changes to 'requested'.
-- Project status changes to 'schedule_requested'.
CREATE OR REPLACE FUNCTION public.request_schedule_slots(
  p_project_id uuid,
  p_slot_ids bigint[], -- Array of slot IDs (even if single selection, keep array for flexibility)
  p_user_id text -- Verification
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_owner text;
BEGIN
  -- 1. Verify Project Ownership
  SELECT user_id INTO v_project_owner
  FROM public.projects
  WHERE id = p_project_id;

  IF v_project_owner IS NULL OR v_project_owner != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to modify this project';
  END IF;

  -- 2. Update Time Slots
  -- Ensure slots are still available before booking
  UPDATE public.time_slots
  SET 
    booking_status = 'requested',
    project_id = p_project_id
  WHERE id = ANY(p_slot_ids)
    AND is_open = true
    AND booking_status = 'available';

  -- Check if update actually happened (concurrency check)
  IF NOT FOUND THEN
     RAISE EXCEPTION 'Selected slots are no longer available';
  END IF;

  -- 3. Update Project Status
  UPDATE public.projects
  SET status = 'schedule_requested'
  WHERE id = p_project_id;

END;
$$;