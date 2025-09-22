-- 1. `request_schedule_slots` 함수 생성
-- 이 함수는 사용자가 시간 슬롯 예약을 요청할 때 호출되며, 관련 데이터 업데이트를 하나의 트랜잭션으로 처리합니다.
CREATE OR REPLACE FUNCTION public.request_schedule_slots(
    p_project_id uuid,
    p_slot_ids bigint[],
    p_user_id text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 이 함수를 정의한 소유자(admin)의 권한으로 실행되어 RLS를 우회합니다.
AS $$
DECLARE
    project_owner_id text;
    unavailable_slot_count int;
BEGIN
    -- 단계 1: 요청한 사용자가 프로젝트의 소유자인지 확인
    SELECT user_id INTO project_owner_id FROM public.projects WHERE id = p_project_id;

    IF project_owner_id IS NULL THEN
        RAISE EXCEPTION '존재하지 않는 프로젝트입니다. (ID: %)', p_project_id;
    END IF;

    IF project_owner_id != p_user_id THEN
        RAISE EXCEPTION '프로젝트 소유자만 예약을 요청할 수 있습니다.';
    END IF;

    -- 단계 2: 요청된 슬롯들이 모두 'available' 상태인지 확인 (Race Condition 방지)
    -- FOR UPDATE를 사용하여 동시 요청 시에도 정합성을 보장합니다.
    SELECT count(*)
    INTO unavailable_slot_count
    FROM public.time_slots
    WHERE id = ANY(p_slot_ids) AND booking_status != 'available'
    FOR UPDATE;

    IF unavailable_slot_count > 0 THEN
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
    SET status = 'schedule_requested'
    WHERE id = p_project_id;

END;
$$;

COMMENT ON FUNCTION public.request_schedule_slots(uuid, bigint[], text) IS '사용자가 특정 프로젝트에 대한 촬영 시간 슬롯 예약을 요청합니다.';
