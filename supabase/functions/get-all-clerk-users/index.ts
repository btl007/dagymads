
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClerkClient } from 'npm:@clerk/clerk-sdk-node';

const clerkClient = createClerkClient({
  secretKey: Deno.env.get('CLERK_SECRET_KEY'),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS', // Allow GET and OPTIONS
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const usersResponse = await clerkClient.users.getUserList();

    // The response might be the array, or an object containing the array.
    const usersArray = Array.isArray(usersResponse) ? usersResponse : (usersResponse as any)?.data;

    if (!Array.isArray(usersArray)) {
      console.error("Unexpected response structure from Clerk SDK:", usersResponse);
      throw new TypeError('Expected an array of users, but received a different structure.');
    }

    const formattedUsers = usersArray.map(user => ({
      id: user.id,
      username: user.username,
      emailAddresses: user.emailAddresses.map(e => ({ emailAddress: e.emailAddress })),
      firstName: user.firstName,
      lastName: user.lastName,
    }));

    return new Response(JSON.stringify(formattedUsers), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error in get-all-clerk-users function: ', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
