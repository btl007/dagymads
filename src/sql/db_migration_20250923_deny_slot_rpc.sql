CREATE OR REPLACE FUNCTION public.deny_schedule_slot(
    p_project_id uuid,
    p_slot_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_slot_current_project_id uuid;
    v_other_requests_count int;
BEGIN
    -- Verify the slot is requested by the correct project to prevent errors
    SELECT project_id INTO v_slot_current_project_id
    FROM public.time_slots
    WHERE id = p_slot_id AND booking_status = 'requested'
    FOR UPDATE;

    IF v_slot_current_project_id IS NULL OR v_slot_current_project_id != p_project_id THEN
        RAISE EXCEPTION 'This slot was not requested by the specified project or is not in a requested state.';
    END IF;

    -- Revert the specific time slot to be available again
    UPDATE public.time_slots
    SET
        booking_status = 'available',
        project_id = NULL
    WHERE id = p_slot_id;

    -- Check if the project has any other pending requests
    SELECT count(*) INTO v_other_requests_count
    FROM public.time_slots
    WHERE project_id = p_project_id AND booking_status = 'requested';

    -- If there are no other pending requests for this project, revert the project's status
    IF v_other_requests_count = 0 THEN
        UPDATE public.projects
        SET status = 'script_submitted' -- Revert to the state before the schedule request
        WHERE id = p_project_id;
    END IF;

END;
$$;

COMMENT ON FUNCTION public.deny_schedule_slot(uuid, bigint) IS 'Admin denies a requested time slot, making it available again and reverting project status if no other requests are pending.';
