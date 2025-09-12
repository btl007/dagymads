import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';

const SupabaseContext = createContext({ supabase: null });

export const SupabaseProvider = ({ children }) => {
  const { getToken } = useAuth();
  const [supabaseClient, setSupabaseClient] = useState(null);

  useEffect(() => {
    const initSupabase = async () => {
      if (getToken) {
        try {
          // The Supabase client is initialized with a custom fetch that
          // automatically injects the latest Clerk token.
          const client = createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY,
            {
              global: {
                fetch: async (url, options = {}) => {
                  const token = await getToken({ template: 'supabase' });

                  const headers = new Headers(options.headers);
                  headers.set('Authorization', `Bearer ${token}`);

                  return fetch(url, { ...options, headers });
                },
              },
            }
          );
          setSupabaseClient(client);
        } catch (error) {
          console.error('Error initializing Supabase client:', error);
          setSupabaseClient(null);
        }
      }
    };

    initSupabase();
  }, [getToken]);

  return (
    <SupabaseContext.Provider value={{ supabase: supabaseClient }}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context.supabase;
};
