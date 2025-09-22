-- 1. `confirm_schedule_slot` 함수 생성
-- 이 함수는 관리자가 요청된 시간 슬롯 중 하나를 최종 촬영일로 확정할 때 호출됩니다.
CREATE OR REPLACE FUNCTION public.confirm_schedule_slot(
    p_project_id uuid,
    p_confirmed_slot_id bigint
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- 관리자 권한으로 실행
AS $$
DECLARE
    v_confirmed_slot_time timestamptz;
    v_slot_current_project_id uuid;
    v_slot_current_status text;
BEGIN
    -- 단계 1: 확정하려는 슬롯의 현재 상태와 요청한 프로젝트 ID를 확인 (Race Condition 방지)
    SELECT project_id, booking_status
    INTO v_slot_current_project_id, v_slot_current_status
    FROM public.time_slots
    WHERE id = p_confirmed_slot_id
    FOR UPDATE;

    -- 유효성 검사
    IF v_slot_current_project_id IS NULL OR v_slot_current_project_id != p_project_id THEN
        RAISE EXCEPTION '해당 슬롯은 다른 프로젝트에 의해 요청되었거나, 요청되지 않은 슬롯입니다.';
    END IF;

    IF v_slot_current_status != 'requested' THEN
        RAISE EXCEPTION '확정하려는 슬롯이 "requested" 상태가 아닙니다. (현재 상태: %)', v_slot_current_status;
    END IF;

    -- 단계 2: 해당 프로젝트가 요청했던 다른 모든 슬롯을 다시 'available' 상태로 되돌림
    UPDATE public.time_slots
    SET 
        booking_status = 'available',
        project_id = NULL
    WHERE 
        project_id = p_project_id 
        AND booking_status = 'requested'
        AND id != p_confirmed_slot_id; -- 확정된 슬롯은 제외

    -- 단계 3: 선택된 슬롯을 'confirmed' 상태로 변경하고, 확정된 시간을 가져옴
    UPDATE public.time_slots
    SET booking_status = 'confirmed'
    WHERE id = p_confirmed_slot_id
    RETURNING slot_time INTO v_confirmed_slot_time;

    -- 단계 4: `projects` 테이블의 상태와 촬영일(shootdate)을 최종 업데이트
    UPDATE public.projects
    SET 
        status = 'schedule_confirmed',
        shootdate = v_confirmed_slot_time::date
    WHERE id = p_project_id;

END;
$$;

COMMENT ON FUNCTION public.confirm_schedule_slot(uuid, bigint) IS '관리자가 프로젝트의 촬영일을 최종 확정합니다.';
