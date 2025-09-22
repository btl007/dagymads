// supabase/functions/get-available-slots/index.ts

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
    // Supabase 클라이언트는 익명 키로 생성합니다.
    // RLS 정책은 요청 헤더의 사용자 JWT를 통해 자동으로 적용됩니다.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // URL에서 쿼리 파라미터 추출
    const url = new URL(req.url)
    const startDate = url.searchParams.get('start_date')
    const endDate = url.searchParams.get('end_date')

    if (!startDate || !endDate) {
      throw new Error('start_date and end_date query parameters are required.')
    }

    // 데이터베이스에서 예약 가능한 슬롯 조회
    const { data, error } = await supabase
      .from('time_slots')
      .select('id, slot_time, is_open, booking_status')
      .gte('slot_time', startDate)
      .lte('slot_time', endDate)
      .eq('is_open', true)
      .eq('booking_status', 'available')
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
