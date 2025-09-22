// supabase/functions/generate-daily-slots/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더 설정 (필요시)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // OPTIONS 요청에 대한 CORS 사전 확인(preflight) 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // --- 보안: 함수 호출 시 secret 키 검증 ---
    const authHeader = req.headers.get('Authorization')!
    if (authHeader !== `Bearer ${Deno.env.get('FUNCTION_SECRET')}`) {
      return new Response('Unauthorized', { status: 401, headers: corsHeaders })
    }

    // --- Supabase 클라이언트 생성 (서비스 키 사용) ---
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- 핵심 로직: 수동 날짜 또는 30일 뒤 날짜 계산 ---
    const body = await req.json().catch(() => ({}))
    const manualDate = body.target_date

    let formattedTargetDate: string;

    if (manualDate && typeof manualDate === 'string') {
      // 수동으로 날짜가 제공된 경우 해당 날짜 사용
      // 간단한 유효성 검사 (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(manualDate)) {
        throw new Error('Invalid date format for target_date. Please use YYYY-MM-DD.')
      }
      formattedTargetDate = manualDate;
    } else {
      // 날짜가 제공되지 않은 경우 (Cron Job), 30일 뒤 날짜를 기본값으로 사용
      const today = new Date()
      const targetDate = new Date(today)
      targetDate.setDate(today.getDate() + 30)
      
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      const day = String(targetDate.getDate()).padStart(2, '0');
      formattedTargetDate = `${year}-${month}-${day}`;
    }

    // --- DB 함수 호출 ---
    const { error } = await supabase.rpc('generate_slots_for_date', { 
      target_date: formattedTargetDate 
    })

    if (error) {
      throw error
    }

    // --- 성공 응답 반환 ---
    return new Response(JSON.stringify({ message: `Successfully generated slots for ${formattedTargetDate}` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // --- 에러 응답 반환 ---
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
