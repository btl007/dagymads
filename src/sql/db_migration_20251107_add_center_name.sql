-- 파일명: db_migration_20251107_add_center_name.sql
-- 설명: user_profiles 테이블에 UI에 표시될 실제 센터 이름(한글 지원)을 저장하기 위한 center_name 컬럼을 추가합니다.

ALTER TABLE public.user_profiles
ADD COLUMN center_name TEXT;

COMMENT ON COLUMN public.user_profiles.center_name IS 'Clerk의 username과 별개로, UI에 표시될 실제 센터 이름 (한글 지원)';
