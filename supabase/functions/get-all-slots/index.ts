// supabase/functions/get-all-slots/index.ts

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

    // 2. URL에서 쿼리 파라미터 추출
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    if (!startDate || !endDate) {
      throw new Error('start_date and end_date query parameters are required.')
    }

    // 3. 데이터베이스에서 모든 슬롯 조회 (상태 필터링 없음)
    // 관리자이므로 RLS를 통과할 수 있지만, 일관성을 위해 userClient를 그대로 사용합니다.
    const { data, error } = await userClient
      .from('time_slots')
      .select('*') // 관리자는 모든 정보가 필요하므로 * 사용
      .gte('slot_time', startDate)
      .lte('slot_time', endDate)
      .order('slot_time', { ascending: true })

    if (error) {
      throw error
    }

    return new Response(JSON.stringify(data), {
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
