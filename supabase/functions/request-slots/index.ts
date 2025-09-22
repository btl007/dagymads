// supabase/functions/request-slots/index.ts

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
    // 1. 사용자 인증 확인을 위한 클라이언트 생성
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), { status: 401, headers: corsHeaders })
    }

    // 2. 요청 본문에서 project_id와 slot_ids 파싱
    const { project_id, slot_ids } = await req.json()
    if (!project_id || !slot_ids || !Array.isArray(slot_ids) || slot_ids.length === 0) {
      throw new Error('project_id and a non-empty array of slot_ids are required.')
    }

    // 3. RPC 호출을 위한 서비스 역할 클라이언트 생성
    // SECURITY DEFINER 함수를 호출하므로 서비스 키가 필요합니다.
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. 데이터베이스 RPC 함수 호출
    const { error } = await serviceRoleClient.rpc('request_schedule_slots', {
      p_project_id: project_id,
      p_slot_ids: slot_ids,
      p_user_id: user.id,
    })

    if (error) {
      // SQL 함수 내부에서 발생한 오류(예: 소유권, 슬롯 상태)를 클라이언트에 전달
      throw error
    }

    return new Response(JSON.stringify({ message: 'Schedule request successful' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400, // 클라이언트 오류 또는 DB 제약 조건 위반
    })
  }
})
