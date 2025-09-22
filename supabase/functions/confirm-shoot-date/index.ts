// supabase/functions/confirm-shoot-date/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. 사용자 인증 및 관리자 권한 확인
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: corsHeaders })
    }

    // Clerk JWT의 public_metadata에 포함된 is_admin 플래그를 확인합니다.
    // Supabase의 user 객체에서는 user.user_metadata 로 접근할 수 있습니다.
    if (user.user_metadata?.is_admin !== true) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders })
    }

    // 2. 요청 본문에서 project_id와 confirmed_slot_id 파싱
    const { project_id, confirmed_slot_id } = await req.json()
    if (!project_id || !confirmed_slot_id) {
      throw new Error('project_id and confirmed_slot_id are required.')
    }

    // 3. RPC 호출을 위한 서비스 역할 클라이언트 생성
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. 데이터베이스 RPC 함수 호출
    const { error } = await serviceRoleClient.rpc('confirm_schedule_slot', {
      p_project_id: project_id,
      p_confirmed_slot_id: confirmed_slot_id,
    })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: 'Schedule confirmed successfully' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
