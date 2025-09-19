import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClerkClient } from '@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({
  secretKey: Deno.env.get('CLERK_SECRET_KEY')!,
});

// Define CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Immediately handle CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Ensure the request method is POST for the main logic
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { userIds } = await req.json();

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return new Response(JSON.stringify({ error: 'userIds array is required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const users = await Promise.all(userIds.map(async (userId) => {
      try {
        const user = await clerkClient.users.getUser(userId);
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
        };
      } catch (e) {
        console.error(`Error fetching user ${userId}: `, e.message);
        return { id: userId, error: 'User not found or error fetching' };
      }
    }));

    const userDetailsMap = users.reduce((acc, user) => {
      if (user && user.id) { // Check for valid user object
        acc[user.id] = user;
      }
      return acc;
    }, {});

    return new Response(JSON.stringify(userDetailsMap), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get-clerk-user-details function: ', error.message);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});