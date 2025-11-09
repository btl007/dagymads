-- 파일명: db_migration_20251107_upgrade_confirm_slot_rpc.sql
-- 설명: 기존 `confirm_schedule_slot` 함수를 업그레이드하여, 관리자가 고객의 요청을 '승인'하는 시나리오와 비어있는 슬롯을 '수동 지정'하는 시나리오를 모두 처리할 수 있도록 개선합니다.
-- 추가: 촬영일 확정 시 `project_activity_logs` 테이블에 상세 로그를 기록하는 로직을 포함합니다.
-- 수정 (2025-11-07): Clerk user ID를 올바르게 가져오기 위해 `auth.uid()` 대신 `auth.jwt() ->> 'sub'`를 사용하도록 수정합니다.

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
    v_log_description text;
    v_actor_id text := auth.jwt() ->> 'sub'; -- Clerk User ID (e.g., 'user_...')
BEGIN
    -- 단계 1: 선택된 슬롯의 현재 상태를 확인 (Race Condition 방지)
    SELECT project_id, booking_status, slot_time
    INTO v_slot_current_project_id, v_slot_current_status, v_confirmed_slot_time
    FROM public.time_slots
    WHERE id = p_confirmed_slot_id
    FOR UPDATE;

    -- 유효성 검사: 슬롯이 존재하지 않는 경우
    IF v_confirmed_slot_time IS NULL THEN
        RAISE EXCEPTION '존재하지 않는 슬롯 ID입니다.';
    END IF;

    -- 시나리오 분기: 슬롯의 현재 상태에 따라 다른 로직 실행
    IF v_slot_current_status = 'available' THEN
        -- [시나리오 A: 수동 지정] 슬롯이 비어있는 경우, 바로 점유
        PERFORM 1;

    ELSIF v_slot_current_status IN ('requested', 'pending') THEN
        -- [시나리오 B: 요청 승인] 슬롯이 이미 요청된 경우, 요청한 프로젝트가 맞는지 확인
        IF v_slot_current_project_id IS NULL OR v_slot_current_project_id != p_project_id THEN
            RAISE EXCEPTION '해당 슬롯은 다른 프로젝트에 의해 요청되었거나, 잘못된 요청입니다.';
        END IF;
    
    ELSIF v_slot_current_status = 'confirmed' AND v_slot_current_project_id = p_project_id THEN
        -- 이미 이 프로젝트로 확정된 슬롯을 다시 누른 경우, 아무것도 하지 않고 성공 처리
        RETURN;

    ELSE
        -- 그 외의 경우 (예: 다른 프로젝트에 의해 이미 'confirmed'된 슬롯)
        RAISE EXCEPTION '해당 슬롯은 현재 확정할 수 없는 상태입니다. (현재 상태: %, 소유자: %)', v_slot_current_status, v_slot_current_project_id;
    END IF;

    -- 단계 2: (공통 로직) 이 프로젝트에 할당되었던 다른 모든 슬롯을 깨끗하게 정리
    UPDATE public.time_slots
    SET 
        booking_status = 'available',
        project_id = NULL
    WHERE 
        project_id = p_project_id 
        AND id != p_confirmed_slot_id;

    -- 단계 3: (공통 로직) 선택된 슬롯을 'confirmed' 상태로 최종 업데이트
    UPDATE public.time_slots
    SET 
        booking_status = 'confirmed',
        project_id = p_project_id
    WHERE id = p_confirmed_slot_id;

    -- 단계 4: (공통 로직) `projects` 테이블의 상태와 촬영일을 최종 업데이트
    UPDATE public.projects
    SET 
        status = 'schedule_fixed',
        shootdate = v_confirmed_slot_time
    WHERE id = p_project_id;

    -- 단계 5: 활동 로그 기록
    v_log_description := '촬영 일정이 ' || to_char(v_confirmed_slot_time, 'YYYY-MM-DD HH24:MI') || '(으)로 확정되었습니다.';
    INSERT INTO public.project_activity_logs (project_id, actor_user_id, description, new_status)
    VALUES (p_project_id, v_actor_id, v_log_description, 'schedule_fixed');

END;
$$;

COMMENT ON FUNCTION public.confirm_schedule_slot(uuid, bigint) IS '관리자가 프로젝트의 촬영일을 최종 확정합니다. (요청 승인 및 수동 지정 겸용)';
