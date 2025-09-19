CREATE OR REPLACE FUNCTION public.close_schedule_on_shootdate_update()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_schedule_id UUID;
    v_schedules_slots JSONB;
    v_shoot_date TEXT;
    v_updated_slots JSONB := '[]'::JSONB;
    v_date_found BOOLEAN := FALSE;
    i INT;
    current_day_slot JSONB;
    _current_date_str TEXT; -- Renamed to avoid conflict
    all_false_slots JSONB;
BEGIN
    -- Check if shootdate is being set or changed
    IF NEW.shootdate IS NOT NULL AND (OLD.shootdate IS NULL OR NEW.shootdate IS DISTINCT FROM OLD.shootdate) THEN
        v_shoot_date := TO_CHAR(NEW.shootdate, 'YYYY-MM-DD');

        -- Get the single schedules entry
        SELECT id, slots INTO v_schedule_id, v_schedules_slots FROM public.schedules LIMIT 1;

        IF v_schedule_id IS NOT NULL THEN
            -- Generate a JSONB object with all slots set to false
            -- Assuming the first day's slots structure is representative for generating all_false_slots
            SELECT JSONB_OBJECT_AGG(key, to_jsonb(false))
            INTO all_false_slots
            FROM JSONB_EACH_TEXT(v_schedules_slots -> 0 -> 'slots');

            FOR i IN 0..JSONB_ARRAY_LENGTH(v_schedules_slots) - 1 LOOP
                current_day_slot := v_schedules_slots -> i;
                _current_date_str := current_day_slot ->> 'date';

                IF _current_date_str = v_shoot_date THEN
                    -- Replace the 'slots' object for this date with all_false_slots
                    v_updated_slots := v_updated_slots || JSONB_SET(current_day_slot, '{slots}', all_false_slots);
                    v_date_found := TRUE;
                ELSE
                    v_updated_slots := v_updated_slots || current_day_slot;
                END IF;
            END LOOP;

            IF v_date_found THEN
                UPDATE public.schedules
                SET slots = v_updated_slots
                WHERE id = v_schedule_id;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Create a trigger that calls the function after an update on projects table
CREATE TRIGGER trg_close_schedule_on_shootdate_update
AFTER UPDATE OF shootdate ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.close_schedule_on_shootdate_update();