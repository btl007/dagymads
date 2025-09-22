-- 1. `get_all_slots` RPC 함수 생성
-- 이 함수는 관리자가 특정 기간의 모든 시간 슬롯을 조회할 때 사용됩니다.
CREATE OR REPLACE FUNCTION public.get_all_slots(
    p_start_date timestamptz,
    p_end_date timestamptz
)
RETURNS SETOF public.time_slots
LANGUAGE plpgsql
AS $$
BEGIN
    -- 단계 1: 요청한 사용자가 관리자인지 확인
    IF ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') != 'true' THEN
        RAISE EXCEPTION 'Forbidden: Admin access required';
    END IF;

    -- 단계 2: 모든 슬롯 데이터 반환
    RETURN QUERY
    SELECT *
    FROM public.time_slots
    WHERE slot_time >= p_start_date AND slot_time <= p_end_date
    ORDER BY slot_time;

END;
$$;

COMMENT ON FUNCTION public.get_all_slots(timestamptz, timestamptz) IS '관리자가 특정 기간의 모든 시간 슬롯을 조회합니다.';
