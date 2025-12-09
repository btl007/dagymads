import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Authorization 헤더 확인 및 JWT 파싱
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    
    // JWT Payload 디코딩 (서명 검증 생략, 클레임 확인용)
    // Edge Runtime에서 atob 사용 가능
    let payload;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        payload = JSON.parse(jsonPayload);
    } catch (e) {
        throw new Error("Invalid Token format");
    }

    // 2. 관리자 권한 확인
    // Clerk JWT는 public_metadata를 포함해야 함.
    const isAdmin = payload.public_metadata?.is_admin === true || payload.public_metadata?.is_admin === "true";

    if (!isAdmin) {
      console.log("Unauthorized Access Attempt. Payload:", payload);
      throw new Error("Unauthorized: Admin privilege required");
    }

    const { userId, newPassword } = await req.json();

    if (!userId || !newPassword) {
      throw new Error("Missing userId or newPassword");
    }

    // 3. Call Clerk API to update password
    const clerkSecretKey = Deno.env.get("CLERK_SECRET_KEY");
    if (!clerkSecretKey) {
      throw new Error("Missing CLERK_SECRET_KEY");
    }

    const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        password: newPassword,
        skip_password_checks: true, 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Clerk API Error: ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();

    // 4. Log to audit_logs
    try {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      await supabaseAdmin.from("audit_logs").insert({
        actor_id: payload.sub, // Admin who performed the action
        target_table: "clerk_users",
        target_id: userId,
        action_type: "RESET_PASSWORD",
        changes: { description: "Password reset by admin" }
      });
    } catch (logError) {
      console.error("Failed to insert audit log:", logError);
      // Do not fail the main request just because logging failed
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
