-- scripts 테이블 RLS 정책 수정
-- 기존 정책이 있다면 충돌할 수 있으니, 관리자 전용 정책을 새로 추가합니다.

-- 1. 관리자가 모든 스크립트를 볼 수 있게 함 (이미 SELECT 정책이 있을 수 있으나 확실히 하기 위해)
CREATE POLICY "Admins can view all scripts"
ON public.scripts
FOR SELECT
USING (
  (auth.jwt() -> 'public_metadata')::jsonb ->> 'is_admin' = 'true'
  OR
  (auth.jwt() -> 'public_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- 2. 관리자가 모든 스크립트를 수정(UPDATE)할 수 있게 함 (승인/반려 등)
CREATE POLICY "Admins can update all scripts"
ON public.scripts
FOR UPDATE
USING (
  (auth.jwt() -> 'public_metadata')::jsonb ->> 'is_admin' = 'true'
  OR
  (auth.jwt() -> 'public_metadata')::jsonb ->> 'is_admin' = 'true'
);

-- 참고: 만약 기존에 "Users can update own scripts" 정책이 있다면, 그건 그대로 두고 이 정책을 추가하면 됩니다.
-- Supabase(PostgreSQL) RLS는 여러 정책 중 하나라도 만족하면 허용(OR 조건)합니다.
