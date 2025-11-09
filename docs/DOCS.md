# Dagymads 기술 문서 (Developer's Guide)

이 문서는 `dagymads` 프로젝트의 기술적인 아키텍처, 핵심 패턴, 그리고 개발 환경 설정에 대한 모든 것을 담고 있습니다. 새로운 개발자가 프로젝트에 참여하거나, 기존 개발자가 특정 구현의 배경을 이해해야 할 때 이 문서를 참고합니다.

---

## 1. 아키텍처 개요 (Architecture Overview)

### 1.1. 기술 스택 (Tech Stack)
- **프론트엔드:** React (Vite), Tailwind CSS, shadcn/ui
- **백엔드:** Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **인증:** Clerk
- **호스팅:** Vercel

### 1.2. 데이터 흐름 (Data Flow)
*(이곳에 Clerk -> Supabase JWT 인증 흐름, 프론트엔드 -> RPC 호출 등 핵심적인 데이터 흐름에 대한 다이어그램이나 설명을 추가합니다.)*

---

## 2. 백엔드 (Supabase & Clerk)

### 2.1. 데이터베이스 스키마 (Database Schema)
*(이곳에 주요 테이블(`projects`, `user_profiles`, `time_slots` 등)의 관계와 역할에 대한 설명을 추가합니다. ERD 이미지를 링크하거나 테이블 구조를 마크다운으로 작성할 수 있습니다.)*

### 2.2. RPC 함수 가이드 (RPC Functions Guide)
*(이곳에 `forSupabase.md`의 핵심 내용이었던 RPC 함수 작성 규칙, 보안 (`SECURITY DEFINER` 등), 그리고 주요 함수들의 역할에 대한 설명을 추가합니다.)*

- **네이밍 컨벤션:** `get_...`, `update_...`, `admin_...`
- **보안:** 모든 함수는 관리자 권한을 확인하는 로직을 포함해야 합니다.
- **주요 함수:**
  - `confirm_schedule_slot`: ...
  - `get_activity_logs`: ...

### 2.3. Clerk 연동 패턴
*(이곳에 Clerk JWT 템플릿 설정 방법, `public_metadata` 활용법 등 Clerk와 Supabase를 연동하는 핵심 노하우를 정리합니다.)*

---

## 3. 프론트엔드 (React)

### 3.1. 핵심 패턴: 사용자 정보 조회 (`UserCacheContext`)
*(이곳에 `temp.md`의 내용, 즉 `UserCacheContext`를 사용하여 여러 페이지에서 사용자 이름을 효율적으로 조회하는 표준 패턴에 대한 설명을 추가합니다.)*
- **문제 정의:** ...
- **해결 방안:** `UserCacheProvider`, `useUserCache` 훅
- **구현 단계:**
  1. `useUserCache` 호출
  2. 데이터 조회 후 `getUserNames` 호출
  3. JSX에서 `userCache[userId]?.username` 사용

### 3.2. 상태 관리 (State Management)
*(이곳에 프로젝트의 전반적인 상태 관리 전략에 대해 기술합니다. (예: React Context, Zustand, Recoil 등))*

### 3.3. UI 컴포넌트 (shadcn/ui)
*(이곳에 커스텀 UI 컴포넌트나 `shadcn/ui` 사용에 대한 특별한 규칙이 있다면 기술합니다.)*

---

## 4. 개발 환경 설정 (Development Setup)

### 4.1. 로컬 환경 실행
1. `npm install`
2. `.env` 파일 설정 (아래 내용 복사 후 키 입력)
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   VITE_CLERK_PUBLISHABLE_KEY=...
   ```
3. `npm run dev`

### 4.2. Supabase CLI 및 로컬 개발
0. 별첨
  사용자께서 다음을 요청하셨습니다.
   1. 문제가 해결된 이유를 설명해달라.
   2. 이 해결책을 supabase_TABLE_TIP.md라는 새 파일에 문서화하고, Supabase
      테이블에서 UUID 및 TEXT 처리와 RLS 정책에 중점을 둔다.


  문제가 해결된 이유:

  정확한 해결 시점과 정확한 트리거를 정확히 파악하기는 어렵습니다.
  그러나 일련의 사건을 기반으로 다음과 같습니다.


   * 초기 문제: user_profiles.user_id는 UUID였지만 Clerk의 user.id는
     TEXT(예: user_xxx)였습니다. UUID가 예상되는 곳에 TEXT가 전달되어
     Supabase 쿼리가 실패했습니다.
   * 시도된 수정 1 (테이블 스키마 및 RLS):
       * user_profiles.user_id를 TEXT로 변경했습니다.
       * REFERENCES auth.users(id)를 제거했습니다 (Clerk의 user.id는
         UUID가 아니기 때문).
       * RLS 정책을 auth.uid()::text = user_id로 조정했습니다 (TEXT와
         TEXT를 비교하기 위해).
       * 이것이 근본적이고 올바른 데이터베이스 수준의 수정이었습니다.
   * 지속적인 오류: 이 후에도 invalid input syntax for type uuid 오류가
     지속되었습니다. 이는 PostgREST(Supabase의 REST API 계층)의 고집스러운
      타입 추론 때문이었습니다. PostgREST는 컬럼이 TEXT임에도 불구하고
     쿼리 매개변수에서 user_id를 UUID로 계속 추론했습니다. 이는
     이름(user_id) 때문이거나 이전에 UUID였을 때의 캐시된 스키마 때문일 수
      있습니다.
   * 시도된 수정 2 (스키마 새로 고침): 더미 컬럼을 추가/제거했습니다.
     (즉시 해결되지 않음).
   * 시도된 수정 3 (RPC 함수): get_user_profile RPC 함수를 생성했습니다.
     (RPC는 SQL에서 작동했지만 프론트엔드 오류는 즉시 해결되지 않음).
   * 최종 작업 (`.filter()`로 변경): 프론트엔드 쿼리를 .rpc()에서
     .from().select().filter()로 다시 전환했습니다.

  최종 해결의 가장 가능성 있는 이유는 다음과 같습니다.


   1. 근본적인 데이터베이스 스키마 변경: user_profiles.user_id가 TEXT인
      것이 필수적이었습니다.
   2. RLS 정책 조정: auth.uid()::text = user_id가 필수적이었습니다.
   3. 지연된 PostgREST 스키마 새로 고침: PostgREST 계층이 결국 따라잡아
      user_profiles.user_id를 TEXT로 올바르게 인식했을 가능성이 높습니다.
      더미 컬럼 트릭이 이를 시작했을 수 있지만, 캐시가 완전히 지워지거나
      서비스가 다시 시작하는 데 시간이 걸릴 수 있습니다. Edge Function의
      반복적인 배포(프록시 포함)도 Supabase 환경의 새로 고침을 강제하는 데
      기여했을 수 있습니다.
   4. `.rpc()`에서 `.filter()`로 전환: .rpc()가 작동했어야 하지만,
      supabase-js가 테이블을 반환하는 rpc 호출과 직접적인 from().filter()
      호출에 대해 타입 추론을 처리하는 방식에 미묘한 차이가 있을 수
      있습니다. filter 메서드가 마침내 새로 고쳐진 PostgREST 스키마와
      결합되어 쿼리가 UUID 추론 없이 통과되었을 가능성이 있습니다.

  `supabase_TABLE_TIP.md`에 대한 핵심 요약:


  핵심 원칙은 다음과 같습니다. 데이터베이스 컬럼, RLS 정책 및 프론트엔드
   쿼리 간의 타입 일관성을 보장합니다.


  Clerk user.id(TEXT, UUID 아님)와 Supabase auth.uid()(UUID)를 다룰 때는
   애플리케이션별 user_id 컬럼에 대해 하나의 타입을 선택하고 비교할 때
  일관되게 캐스팅해야 합니다.

  `user_profiles`(및 Clerk의 `user.id`를 저장하는 유사한 테이블)의 경우:


   * 데이터베이스 컬럼: user_id TEXT PRIMARY KEY. (중요: Clerk의 user.id를
      저장하는 경우 UUID로 만들지 마십시오.)
   * RLS 정책:
       * auth.uid()(UUID)와 비교할 때: auth.uid()::text = user_id.
       * auth.jwt() ->> 'user_id'(Clerk JWT의 TEXT)와 비교할 때:
         auth.jwt() ->> 'user_id' = user_id.
       * auth.jwt() ->> 'public_metadata' ->> 'is_admin'(TEXT)와 비교할
         때: ((auth.jwt() ->> 'public_metadata')::jsonb ->> 'is_admin') =
         'true'.
   * 프론트엔드 쿼리:
       * supabase.from('table_name').select().filter('user_id', 'eq',
         user.id)를 사용합니다.
       * user.id가 RPC에 매개변수로 전달되는 경우, RPC 매개변수가 TEXT인지
          확인합니다.
       * RPC가 SETOF a_table을 반환하고 user_id 컬럼을 포함하는 경우,
         RPC의 SELECT 문에서 user_id를 TEXT로 명시적으로
         캐스팅합니다(user_id::TEXT). 이는 PostgREST에 도움이 됩니다.
   * PostgREST 캐시: PostgREST는 스키마 정보를 캐시할 수 있음을 인지해야
     합니다. 컬럼 타입을 변경하는 경우 스키마 새로 고침(더미 컬럼
     추가/제거)이 필요할 수 있으며, 전파되는 데 시간이 걸릴 수 있습니다.

  1. 22P02 에러 관련
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

