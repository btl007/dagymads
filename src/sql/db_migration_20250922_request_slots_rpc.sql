CREATE OR REPLACE FUNCTION public.request_schedule_slots(
    p_project_id uuid,
    p_slot_ids bigint[],
    p_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $FUNCTION_BODY$
DECLARE
    project_owner_id text;
    unavailable_slot_id bigint;
BEGIN
    -- 단계 1: 요청한 사용자가 프로젝트의 소유자인지 확인
    SELECT user_id INTO project_owner_id FROM public.projects WHERE id = p_project_id;

    IF project_owner_id IS NULL THEN
        RAISE EXCEPTION '존재하지 않는 프로젝트입니다. (ID: %)', p_project_id;
    END IF;

    IF project_owner_id != p_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자만 예약을 요청할 수 있습니다.';
    END IF;

    -- 단계 2 (수정됨): 요청된 슬롯 중 예약 불가능한 것이 있는지 확인하고 해당 로우들을 잠급니다.
    SELECT id
    INTO unavailable_slot_id
    FROM public.time_slots
    WHERE id = ANY(p_slot_ids) AND booking_status != 'available'
    FOR UPDATE
    LIMIT 1; -- We only need to know if at least one exists

    -- 만약 예약 불가능한 슬롯이 하나라도 발견되면 예외를 발생시킵니다.
    IF unavailable_slot_id IS NOT NULL THEN
        RAISE EXCEPTION '선택한 시간 중 일부는 이미 예약되었거나 예약 불가능한 상태입니다. 다시 시도해주세요.';
    END IF;

    -- 단계 3: `time_slots` 테이블 업데이트
    UPDATE public.time_slots
    SET 
        booking_status = 'requested',
        project_id = p_project_id
    WHERE id = ANY(p_slot_ids);

    -- 단계 4: `projects` 테이블 상태 업데이트
    UPDATE public.projects
    SET status = 'schedule_submitted'
    WHERE id = p_project_id;

END;
$FUNCTION_BODY$;

COMMENT ON FUNCTION public.request_schedule_slots(uuid, bigint[], text) IS '사용자가 특정 프로젝트에 대한 촬영 시간 슬롯 예약을 요청합니다.';
