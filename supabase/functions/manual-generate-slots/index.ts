// supabase/functions/manual-generate-slots/index.ts
// This function acts as a secure proxy for the `generate-daily-slots` function.

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

    // --- DEBUG: Log the user object to inspect its contents ---
    console.log('--- User Object from JWT ---');
    console.log(JSON.stringify(user, null, 2));
    // --- END DEBUG ---

    if (!user || user.user_metadata?.is_admin !== true) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: corsHeaders })
    }

    // 2. 요청 본문에서 target_date 파싱
    const { target_date } = await req.json()
    if (!target_date || typeof target_date !== 'string') {
      throw new Error('target_date (YYYY-MM-DD) is required.')
    }

    // 3. 내부적으로 `generate-daily-slots` 함수를 안전하게 호출
    const functionUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-daily-slots`
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('FUNCTION_SECRET')}`,
      },
      body: JSON.stringify({ target_date: target_date }),
    })

    if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to call generate-daily-slots function: ${response.statusText}`)
    }

    const responseData = await response.json()

    // 4. `generate-daily-slots`의 성공 응답을 클라이언트에 전달
    return new Response(JSON.stringify(responseData), {
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
