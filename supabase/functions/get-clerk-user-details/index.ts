//supabase/functions/get-clerk-user-details/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClerkClient } from '@clerk/clerk-sdk-node';

//initialize Clerk Client with the secret key from Supabase secrets
const clerkClient = createClerkClient({
  secretKey: Deno.env.get('CLERK_SECRET_KEY')!,
});

//handle GET requests
serve(async (req) => {
 if (req.method !== 'POST') {
  return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
    headers: { 'Content-Type': 'application/json' },
    status: 405,
  });
 }
 
 try {
  const { userIds } = await req.json();

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return new Response(JSON.stringify({ error: 'userIds array is required' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  const users = await Promise.all(userIds.map(async (userId) => {
    try {
      const user = await clerkClient.users.getUser(userId);
      // Return relevant user dtails, e.g., firstName, lastName, email, imageUrl
      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        //can add more
      };
    } catch (e) {
      console.error(`Error fetching user ${userId}: `, e);
      return { id: userIds, error: 'User not found or error fetching' };
    }
  })
  );

  //create a map for easy lookup on the frontend
  const userDetailsMap = users.reduce((acc, user) => {
    acc[user.id] = user;
    return acc;
  }, {});

  return new Response(JSON.stringify(userDetailsMap), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  });
 } catch (error) {
  console.error('Error in get-clerk-user-details function: ', error);
  return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
    headers: { 'Content-Type': 'application/json' },
    status: 500,
  });
 }

});
