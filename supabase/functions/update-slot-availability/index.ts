// supabase/functions/update-slot-availability/index.ts

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

    if (user.user_metadata?.is_admin !== true) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders })
    }

    // 2. 요청 본문에서 slot_ids와 is_open 파싱
    const { slot_ids, is_open } = await req.json()
    if (!slot_ids || !Array.isArray(slot_ids) || typeof is_open !== 'boolean') {
      throw new Error('An array of slot_ids and a boolean is_open are required.')
    }

    if (slot_ids.length === 0) {
        return new Response(JSON.stringify({ message: 'No slots to update.' }), { headers: corsHeaders, status: 200 })
    }

    // 3. 업데이트를 위한 서비스 역할 클라이언트 생성
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 4. `time_slots` 테이블 직접 업데이트
    const { data, error } = await serviceRoleClient
      .from('time_slots')
      .update({ is_open: is_open })
      .in('id', slot_ids)
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ message: `Successfully updated ${data.length} slots.`, updated_slots: data }), {
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
