
import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react'; // ADDED: Import useAuth

const UserCacheContext = createContext();

export const useUserCache = () => useContext(UserCacheContext);

export const UserCacheProvider = ({ children }) => {
  const [userCache, setUserCache] = useState({}); // { userId: { username: '...' }, ... }
  const [isFetching, setIsFetching] = useState(false);
  const { getToken, isLoaded, isSignedIn } = useAuth(); // MODIFIED: Get getToken, isLoaded, isSignedIn from Clerk

  const getUserNames = useCallback(async (userIds) => {
    if (!userIds || userIds.length === 0) {
      return {};
    }

    const missingUserIds = userIds.filter(id => !userCache[id]);

    if (missingUserIds.length === 0) {
      return userCache;
    }

    // MODIFIED: Guard against Clerk not being ready
    if (!isLoaded || !isSignedIn || !getToken) {
      console.warn('Clerk not ready or user not signed in. Cannot fetch user details.');
      return userCache;
    }

    setIsFetching(true);
    try {
      const token = await getToken({ template: 'supabase' }); // Get the Clerk JWT

      console.log('Attempting to fetch user details with token:', token); // ADDED THIS LINE

      const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // MODIFIED: Add Authorization header
        },
        body: JSON.stringify({ userIds: missingUserIds }),
      });

      if (!response.ok) {
        // Handle non-JSON "Rate exceeded" error gracefully
        if (response.headers.get('content-type')?.includes('text/plain')) {
          const text = await response.text();
          if (text.includes('Rate exceeded')) {
            console.warn('Rate limit exceeded while fetching user details.');
            return userCache; // Return what we have
          }
        }
        throw new Error('Failed to fetch user details');
      }

      const newUsers = await response.json();
      
      setUserCache(prevCache => {
        const updatedCache = { ...prevCache, ...newUsers };
        return updatedCache;
      });
      
      return { ...userCache, ...newUsers };

    } catch (error) {
      console.error('Error in getUserNames:', error);
      return userCache; // On error, return existing cache
    } finally {
      setIsFetching(false);
    }
  }, [userCache, getToken, isLoaded, isSignedIn]); // MODIFIED: Add getToken, isLoaded, isSignedIn to dependencies

  const value = { userCache, getUserNames, isFetching };

  return (
    <UserCacheContext.Provider value={value}>
      {children}
    </UserCacheContext.Provider>
  );
};
