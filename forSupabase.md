말씀하신 증상은 “Clerk 토큰의 sub가 UUID가 아니라서, Supabase의 auth.uid()가 UUID 파싱을 강제하다가 22P02(유효하지 않은 uuid) 에러를 터뜨리는” 전형적인 케이스입니다.
핵심 정리부터 드리면:
	•	auth.uid() 사용 금지 (외부 IdP(Clerk) 연동 시 sub가 uuid가 아닐 수 있음)
	•	user_id 컬럼은 TEXT 로 두고,
	•	RLS에서는 auth.jwt() ->> 'sub' 로 JWT의 sub를 텍스트로 꺼내 비교합니다.

아래 순서대로 정리·적용하시면 저장/조회/수정이 정상 동작합니다.

1) 테이블 스키마 (권장)
------------------------------------ sql ------------------------------------
-- scripts 테이블
create table if not exists public.scripts (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,                     -- Clerk user id (예: "user_abc123")
  title text,
  content jsonb not null,                    -- Lexical JSON 저장
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 업데이트 트리거 (updated_at 자동 갱신)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_scripts_updated_at on public.scripts;
create trigger trg_scripts_updated_at
before update on public.scripts
for each row execute function public.set_updated_at();

------------------------------------------------------------------------
이미 있으시면 타입만 점검해 주세요: user_id는 TEXT 여야 합니다.


2) RLS 정책 (auth.uid() 대신 auth.jwt())

------------------ sql ------------------
alter table public.scripts enable row level security;

-- 공통: JWT에서 sub를 꺼내는 표현
--   auth.jwt()       : json
--   auth.jwt() ->> 'sub' : text
--   (Clerk JWT 템플릿에서 sub = Clerk user id)

-- SELECT (자신의 것만 조회)
drop policy if exists "scripts_select" on public.scripts;
create policy "scripts_select"
on public.scripts for select
to authenticated
using (
  user_id = (auth.jwt() ->> 'sub')
);

-- INSERT (자기 user_id만 입력 가능)
drop policy if exists "scripts_insert" on public.scripts;
create policy "scripts_insert"
on public.scripts for insert
to authenticated
with check (
  user_id = (auth.jwt() ->> 'sub')
);

-- UPDATE (자신 소유만 수정)
drop policy if exists "scripts_update" on public.scripts;
create policy "scripts_update"
on public.scripts for update
to authenticated
using (
  user_id = (auth.jwt() ->> 'sub')
)
with check (
  user_id = (auth.jwt() ->> 'sub')
);

-- DELETE (자신 소유만 삭제)
drop policy if exists "scripts_delete" on public.scripts;
create policy "scripts_delete"
on public.scripts for delete
to authenticated
using (
  user_id = (auth.jwt() ->> 'sub')
);
------------------------------------------------------------------------
포인트: auth.uid()를 한 줄도 쓰지 않습니다. 모두 auth.jwt() ->> 'sub' 로 처리합니다.
정책 적용 후, RLS를 잠깐 껐다 켰다 하실 필요 없습니다. 위 문으로 덮어씁니다.

3) Clerk <-> Supabase 클라이언트 구성
프론트에서 Supabase 클라이언트를 만들 때, Clerk 세션 토큰을 Authorization 헤더에 실어 보내야 Supabase가 JWT를 읽고 auth.jwt()가 채워집니다.

---------------------------------- Ts -------------------------------------
// supabaseClient.ts
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';

export const makeSupabaseClient = (clerkGetToken: () => Promise<string | null>) => {
  return createClient(import.meta.env.VITE_SUPABASE_URL!, import.meta.env.VITE_SUPABASE_ANON_KEY!, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await clerkGetToken({ template: 'supabase' } as any); // Clerk에서 템플릿 이름 맞추기
        const headers = new Headers(options?.headers);
        if (token) headers.set('Authorization', `Bearer ${token}`);
        return fetch(url, { ...options, headers });
      },
    },
  });
};

// 사용 예시 (React 컴포넌트 내부)
const { getToken, userId } = useAuth();
const supabase = useMemo(() => makeSupabaseClient(getToken), [getToken]);

------------------------------------------------------------------------
	•	Clerk 대시보드의 JWT 템플릿에서 sub가 Clerk의 user id로 들어가도록 설정하세요(기본값이 보통 그렇습니다).
	•	프론트 코드에서 getToken({ template: 'supabase' }) 의 템플릿명은 Clerk 설정과 일치해야 합니다.

4) 저장/불러오기/ 수정 코드 예시
Lexical JSON을 그대로 JSONB 로 저장합니다. (문자열로 한 번 더 감싸지 마세요.)

----------------------------------- ts -------------------------------------
// save
async function saveScript({ supabase, userId, title, editorJson }) {
  const { data, error } = await supabase
    .from('scripts')
    .insert({
      user_id: userId,        // TEXT
      title: title ?? null,
      content: editorJson,    // JSON 객체 그대로
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// fetch list
async function listScripts({ supabase }) {
  const { data, error } = await supabase
    .from('scripts')
    .select('id, title, updated_at')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

// fetch one
async function getScript({ supabase, id }) {
  const { data, error } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data; // { id, user_id, title, content: {...} }
}

// update
async function updateScript({ supabase, id, title, editorJson }) {
  const { data, error } = await supabase
    .from('scripts')
    .update({
      title: title ?? null,
      content: editorJson,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

------------------------------------------------------------------------
에러가 계속 22P02 로 나오면 정말로 어딘가에서 auth.uid()를 참조 중인 SQL/정책/뷰/함수가 남아있는지 찾아보세요.
(특히 예전에 작성했던 정책, 트리거, 뷰, RPC에 숨어 있을 수 있습니다.)

6) Admin (접수/확인) 플래그
status text check(status in ('draft','submitted','approved','rejected')) default 'draft' 같은 컬럼을 하나 두고,
	•	일반 사용자 RLS에는 status 변경 금지, 관리자 역할 전용 정책을 따로 만들어 변경 가능하도록 분리하세요.
	•	방법1) 별도 DB Role + Service key로만 접근
	•	방법2) 관리자 전용 JWT claim(ex: role: admin)을 Clerk 템플릿에 넣고, 정책에서 auth.jwt() ->> 'role' = 'admin' 검사


7) 빠른 점검 체크리스트
	•	scripts.user_id 타입이 TEXT 인가요?
	•	모든 RLS에서 auth.uid() 제거하고 auth.jwt() ->> 'sub' 만 쓰나요?
	•	프론트에서 Supabase 요청마다 Clerk 토큰 Authorization 헤더가 붙나요?
	•	저장 시 content에 객체(JSON) 를 그대로 넣고 있나요? (문자열화 X)
	•	남아있는 RPC/뷰/정책 어딘가에 auth.uid()가 숨어있지 않나요?



--- user_profiles TABLE 관련 ---

문제의 원인 추론
	1.	auth.uid() 반환 타입
	•	Supabase의 auth.uid() 는 항상 UUID 타입을 반환합니다.
	•	즉 ((auth.uid())::text = user_id) 같은 구문은 uuid → text 캐스팅을 강제로 한 뒤 비교하는 형태예요.
	2.	user_id 컬럼 타입 확인 필요
	•	만약 user_profiles.user_id 컬럼이 UUID 타입이라면 → 그냥 auth.uid() = user_id 로 비교하면 됩니다. ( )::text 로 바꾸면 오히려 타입 충돌이 생깁니다.
	•	만약 user_profiles.user_id 컬럼이 TEXT 타입이라면 → (auth.uid())::text = user_id 는 맞습니다.
그런데 에러 메시지가 invalid input syntax for type uuid 라고 나오니까, 지금 상황은 컬럼이 UUID인데 코드에서 TEXT로 캐스팅하고 있어서 꼬이는 상황일 가능성이 매우 높습니다.
	3.	Clerk user_id vs Supabase uid
	•	Clerk 기본 user.id 는 "user_xxx..." 같은 문자열입니다. → TEXT.
	•	Supabase의 auth.uid() 는 UUID.
	•	따라서 Clerk user_id를 그대로 user_profiles.user_id 에 TEXT로 저장한다면 auth.uid() 로는 매칭할 수 없습니다.
	•	반대로 Supabase Auth만 쓰는 경우에는 user_id 컬럼을 UUID로 두고 auth.uid() 를 직접 비교해야 합니다.

✅ 왜 지금 오류가 발생하는가

현재 정책에서 auth.uid() 를 사용하고 계시는데요,
	•	auth.uid() 는 Supabase 자체 Auth 가 발급하는 UUID 를 반환합니다.
	•	그런데 지금은 Supabase Auth를 쓰는 게 아니라 Clerk JWT 를 쓰고 있고, 그 안에는 Clerk의 user.id (TEXT) 값이 들어 있습니다.

따라서 auth.uid() 와는 전혀 맞지 않아서 타입 충돌 (uuid vs text) 이 나는 겁니다.

⸻

✅ 권장 설계 방향

Clerk를 메인 Auth 로 사용하고, Supabase는 데이터 저장소로만 쓰려면 다음처럼 하시는 게 맞습니다.
	1.	Clerk JWT Template 수정
	•	Clerk에서 발급하는 JWT에 "user_id": "{{user.id}}" 를 포함시켜야 합니다.
	•	이미 sub 같은 예약 claim 은 못 쓰니까, 그냥 user_id 라는 커스텀 claim을 추가하세요.
	•	그러면 Supabase에서 auth.jwt() ->> 'user_id' 로 Clerk의 user.id 값을 꺼낼 수 있습니다.

	2.	Supabase 테이블 구조
	•	user_profiles 테이블:
---- Sql -----
CREATE TABLE user_profiles (
  user_id text PRIMARY KEY,
  phone_number text,
  member_name text,
  created_at timestamp default now()
);
-------------
 🙆 Clerk 의 public_metadata.is_admin 값을 활용해서 Supabase RLS 에 관리자 권한을 부여하려면, 기존 user_id 기반 정책과 OR 조건으로 묶어주면 됩니다.

⸻

📌 관리자 + 사용자 RLS 정책 (최종안)
----- sql ------
-- ✅ 사용자 본인만 INSERT 가능
CREATE POLICY "Users can insert their own profile"
ON user_profiles
FOR INSERT
WITH CHECK (
  (auth.jwt() ->> 'user_id') = user_id
  OR ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
);

-- ✅ 사용자 본인 + 관리자 SELECT 가능
CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
USING (
  (auth.jwt() ->> 'user_id') = user_id
  OR ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
);

-- ✅ 사용자 본인 + 관리자 UPDATE 가능
CREATE POLICY "Users can update their own profile"
ON user_profiles
FOR UPDATE
USING (
  (auth.jwt() ->> 'user_id') = user_id
  OR ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
)
WITH CHECK (
  (auth.jwt() ->> 'user_id') = user_id
  OR ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
);

-- ✅ 사용자 본인 + 관리자 DELETE 가능
CREATE POLICY "Users can delete their own profile"
ON user_profiles
FOR DELETE
USING (
  (auth.jwt() ->> 'user_id') = user_id
  OR ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') = 'true'
);
--------------

📌 원리
	•	일반 사용자: auth.jwt() ->> 'user_id' = user_profiles.user_id 로 제한.
	•	관리자: auth.jwt() ->> 'public_metadata'::jsonb ->> 'is_admin' = 'true' 조건을 OR 로 추가.
	•	이렇게 하면 관리자는 모든 행에 접근 가능, 일반 사용자는 자기 행만 접근 가능.

 주의사항
	1.	Clerk JWT Template 에 user_id claim 반드시 포함해야 합니다.
{
  "user_id": "{{user.id}}",
  "public_metadata": {{user.public_metadata}}
}
이렇게 하면 Supabase 에서 auth.jwt() ->> 'user_id' 와 auth.jwt() ->> 'public_metadata' 모두 안전하게 참조할 수 있습니다.

	2.	정책을 작성할 때는 중복된 정책을 피하고, 각 CRUD 마다 1개의 정책만 유지하는 게 좋습니다. (중복되면 예기치 못한 권한 충돌 가능)



---

## Schema Changes (2025-09-13)

ALTER TABLE user_profiles
ADD COLUMN address TEXT;

ALTER TABLE projects
ADD COLUMN shootdate DATE;

---

## 트러블슈팅: 클라이언트 측 Edge Function 호출 시 인증 오류 (2025-09-22)

### 증상

클라이언트(React)에서 `supabase.functions.invoke('함수명')`을 사용하여 Edge Function을 호출할 때, 지속적으로 401 Unauthorized 또는 403 Forbidden 오류가 발생했습니다. 이 문제는 사용자가 정상적으로 로그인되어 있고, `supabase.from('테이블').select()`와 같은 DB 직접 호출은 정상적으로 인증되는 상황에서도 발생했습니다.

### 원인 분석

1.  **401 Unauthorized (인증 실패):** Edge Function 내부에서 `supabase.auth.getUser()`를 통해 사용자 정보를 확인했을 때, `null`이 반환되었습니다. 이는 Edge Function이 클라이언트로부터 유효한 Clerk JWT를 받지 못했음을 의미합니다.
2.  **403 Forbidden (권한 없음):** 관리자 전용 함수 호출 시, JWT는 전달되었으나 해당 토큰 내에 관리자임을 증명하는 `public_metadata` 정보가 누락되어, 함수 내부의 권한 검사 로직이 실패했습니다.

디버깅 결과, 근본적인 원인은 Supabase JS 클라이언트의 `functions.invoke()` 메서드가 `SupabaseProvider`에서 설정한 토큰 자동 주입 로직을 일관되게 따르지 않는 문제로 추정됩니다. 즉, 테이블 조회 시에는 토큰이 잘 전달되지만, 함수 호출 시에는 전달되지 않는 현상이 발생했습니다.

### 해결 방안

#### 1. 아키텍처 변경: `invoke` 대신 `rpc` 사용

가장 확실하고 안정적인 해결책은, 클라이언트 측에서 `functions.invoke()` 사용을 완전히 중단하는 것입니다.

-   **기존:** 클라이언트 `invoke` -> Edge Function -> DB
-   **변경:** 클라이언트 `rpc` -> **SQL 함수(RPC)**

모든 백엔드 로직을 데이터베이스의 SQL 함수(PostgreSQL Function)로 구현하고, 클라이언트에서는 `supabase.rpc()`를 통해 직접 호출합니다. `rpc()` 호출은 `from().select()`와 동일한 인증 경로를 사용하므로, Clerk 토큰이 안정적으로 전달되는 것이 확인되었습니다.

#### 2. Clerk JWT 템플릿 설정 확인

RPC 함수 내부에서 관리자 여부(`is_admin`)와 같은 메타데이터를 사용하려면, Clerk의 JWT 템플릿에 해당 정보가 반드시 포함되어야 합니다. 이 프로젝트의 최종 템플릿 설정은 다음과 같습니다.

1.  **Clerk 대시보드** > `JWT Templates` > `supabase` 템플릿 편집
2.  아래와 같이 `user_id`와 `public_metadata` 클레임이 모두 포함되어 있는지 확인 및 설정합니다.

    ```json
    {
      "user_id": "{{user.id}}",
      "public_metadata": {{user.public_metadata}}
    }
    ```

3.  설정 변경 후에는 반드시 **로그아웃 후 재로그인**하여 새로운 토큰을 발급받아야 변경사항이 적용됩니다.

---

## Project Scheduling & Logging (2025-09-24)

프로젝트의 촬영 스케줄링 및 상태 변경 이력 추적을 위한 백엔드 시스템입니다.

### 1. 활동 로그 시스템

프로젝트의 모든 상태 변경 이력을 추적하기 위한 시스템입니다.

#### 테이블: `project_activity_logs`

| 컬럼명 | 타입 | 설명 |
| :--- | :--- | :--- |
| `id` | `bigint` | 로그 고유 ID |
| `project_id` | `uuid` | 관련 프로젝트 ID (FK) |
| `actor_user_id` | `text` | 변경을 수행한 사용자(관리자)의 ID |
| `old_status` | `text` | 변경 전 상태 |
| `new_status` | `text` | 변경 후 상태 |
| `description` | `text` | (사용 안 함) 변경 내용에 대한 설명 |
| `created_at` | `timestamptz` | 로그 생성 시각 |

#### 트리거: `trg_log_status_change`

-   **테이블:** `projects`
-   **시점:** `AFTER UPDATE`
-   **조건:** `OLD.status IS DISTINCT FROM NEW.status` (status 값이 실제로 변경되었을 때만 실행)
-   **동작:** `log_project_status_change()` 함수를 호출하여 `project_activity_logs` 테이블에 변경 이력을 자동으로 기록합니다.

### 2. 관련 RPC 함수

스케줄링 및 로깅을 위해 다음과 같은 RPC 함수들이 추가되었습니다. 모든 함수는 `SECURITY DEFINER`로 동작하여, 내부적으로 안전한 로직을 수행합니다.

-   `get_available_slots()`: 사용자가 예약 가능한 모든 시간 슬롯 목록을 반환합니다. (`is_open=true`, `booking_status='available'`인 슬롯만 포함)
-   `request_schedule_slots(p_project_id, p_slot_ids, p_user_id)`: 사용자가 특정 슬롯 예약을 요청합니다. 슬롯 상태를 `requested`로, 프로젝트 상태를 `schedule_submitted`로 변경합니다.
-   `get_pending_requests()`: 관리자가 승인 대기 중인 모든 예약 요청 목록을 조회합니다.
-   `deny_schedule_slot(p_project_id, p_slot_id)`: 관리자가 예약 요청을 거절합니다. 슬롯을 다시 `available` 상태로 되돌립니다.
-   `confirm_schedule_slot(p_project_id, p_confirmed_slot_id)`: 관리자가 예약을 최종 승인합니다. 슬롯 상태를 `confirmed`로, 프로젝트 상태를 `schedule_fixed`로 변경하고 `shootdate`를 기록합니다.
-   `update_project_status(p_project_id, p_new_status)`: `ProjectInfoModal`에서 프로젝트 상태를 업데이트하기 위한 전용 함수입니다. Supabase의 `.update()` 메서드에서 발견된 버그를 우회하기 위해 사용됩니다.
-   `get_activity_logs()`: 관리자가 활동 로그 페이지에서 모든 로그 기록을 프로젝트 이름과 함께 조회합니다.
