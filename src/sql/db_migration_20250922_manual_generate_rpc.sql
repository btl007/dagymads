-- 1. `manual_generate_slots` RPC 함수 생성
-- 이 함수는 관리자가 수동으로 특정 날짜의 시간 슬롯을 생성할 때 사용됩니다.
CREATE OR REPLACE FUNCTION public.manual_generate_slots(
    p_target_date date
)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
    -- 단계 1: 요청한 사용자가 관리자인지 확인
    IF ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') != 'true' THEN
        RAISE EXCEPTION 'Forbidden: Admin access required';
    END IF;

    -- 단계 2: 기존에 만들어둔 슬롯 생성 함수 호출
    PERFORM generate_slots_for_date(p_target_date);

    -- 단계 3: 성공 메시지 반환
    RETURN 'Successfully generated slots for ' || p_target_date::text;

END;
$$;

COMMENT ON FUNCTION public.manual_generate_slots(date) IS '관리자가 수동으로 특정 날짜의 시간 슬롯을 생성합니다.';
