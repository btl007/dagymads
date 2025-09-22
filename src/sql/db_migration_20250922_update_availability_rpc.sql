-- 1. `update_slot_availability` RPC 함수 생성
-- 이 함수는 관리자가 여러 시간 슬롯의 `is_open` 상태를 일괄 변경할 때 사용됩니다.
CREATE OR REPLACE FUNCTION public.update_slot_availability(
    p_slot_ids bigint[],
    p_is_open boolean
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- 단계 1: 요청한 사용자가 관리자인지 확인
    IF ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') != 'true' THEN
        RAISE EXCEPTION 'Forbidden: Admin access required';
    END IF;

    -- 단계 2: `time_slots` 테이블 업데이트
    -- 중요: 이미 예약되었거나(requested, confirmed) 예약된 슬롯은 is_open 상태를 변경하지 않도록 booking_status = 'available' 조건을 추가하여 안전장치를 마련합니다.
    UPDATE public.time_slots
    SET is_open = p_is_open
    WHERE id = ANY(p_slot_ids) AND booking_status = 'available';

END;
$$;

COMMENT ON FUNCTION public.update_slot_availability(bigint[], boolean) IS '관리자가 여러 시간 슬롯의 예약 가능 여부(is_open)를 일괄 변경합니다.';
