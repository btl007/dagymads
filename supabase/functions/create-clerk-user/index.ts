// supabase/functions/create-clerk-user/index.ts
    import { serve } from
      'https://deno.land/std@0.168.0/http/server.ts';
    import { createClerkClient } from '@clerk/clerk-sdk-node';
    import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Supabase 클라이언트 가져오기
    
     // Supabase secrets에서 비밀 키로 Clerk 클라이언트 초기화
    const clerkClient = createClerkClient({
       secretKey: Deno.env.get('CLERK_SECRET_KEY'),
    });
   
    // 전체 액세스를 위해 service_role 키로 Supabase 클라이언트 초기화
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
   
   const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });
   
    // CORS 헤더 정의
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*', // 로컬 개발을 위해 모든 출처 허용. 프로덕션에서는 제한.
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', // POST 메서드 허용
    };
   
    serve(async (req) => {
      // CORS preflight 요청 처리
      if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
      }
   
      if (req.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
          headers: { ...corsHeaders, 'Content-Type':
      'application/json' },
          status: 405,
        });
      }
   
      try {
        const { username, password, email, firstName, lastName, phoneNumber, memberName } = await req.json();
   
        if (!username && !email) {
          return new Response(JSON.stringify({ error: 'Username or email is required for Clerk user creation' }), {
            headers: { ...corsHeaders, 'Content-Type':
      'application/json' },
            status: 400,
          });
        }
        if (!password) {
          return new Response(JSON.stringify({ error: 'Password is required for Clerk user creation' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }
   
        if (!memberName) {
          return new Response(JSON.stringify({ error: 'Member name (센터명) is required' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400,
          });
        }

        // 0. Check for duplicate member_name in user_profiles
        const { data: existingProfile, error: existingProfileError } = await supabase
          .from('user_profiles')
          .select('member_name')
          .eq('member_name', memberName)
          .single();

        if (existingProfile) {
          return new Response(JSON.stringify({ error: `Member name '${memberName}' already exists.` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 409, // 409 Conflict
          });
        }

        // 1. Clerk에 사용자 생성
        const clerkUserProps: any = { password };
        if (username) clerkUserProps.username = username;
        if (email) clerkUserProps.emailAddress = email;
        if (firstName) clerkUserProps.firstName = firstName;
        if (lastName) clerkUserProps.lastName = lastName;
   
        const clerkUser = await clerkClient.users.createUser(clerkUserProps);
   
        // 2. Supabase user_profiles 테이블에 프로필 생성
        const { error: supabaseError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: clerkUser.id, // Clerk의 사용자 ID
            phone_number: phoneNumber || null,
            member_name: memberName || null,
          });
   
        if (supabaseError) {
          console.error('Supabase 사용자 프로필 생성 오류:', supabaseError);
          // 프로필 생성 실패 시 방금 만든 Clerk 사용자 롤백
          await clerkClient.users.deleteUser(clerkUser.id);
          return new Response(JSON.stringify({ error: `Supabase 프로필 생성 실패: ${supabaseError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }

        // 3. Supabase projects 테이블에 첫 프로젝트 자동 생성
        const projectName = `${memberName || username}의 첫 광고 영상`;
        const { error: projectError } = await supabase
          .from('projects')
          .insert({
            user_id: clerkUser.id,
            name: projectName,
            status: 'script_needed',
          });

        if (projectError) {
          console.error('Supabase 프로젝트 생성 오류:', projectError);
          // 프로젝트 생성 실패 시 방금 만든 Clerk 사용자 및 Supabase 프로필 롤백
          await clerkClient.users.deleteUser(clerkUser.id);
          // user_profiles는 user_id에 ON DELETE CASCADE가 설정되어 자동 삭제됩니다.
          return new Response(JSON.stringify({ error: `프로젝트 생성 실패: ${projectError.message}` }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
          });
        }
   
        return new Response(JSON.stringify({ success: true, userId: clerkUser.id }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        });
      } catch (error) {
        console.error('Edge Function 오류:', error);
        return new Response(JSON.stringify({ error: error.message || '내부 서버 오류' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        });
      }
    });