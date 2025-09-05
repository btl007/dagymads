import { createContext, useContext, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { createClient } from '@supabase/supabase-js';

const SupabaseContext = createContext(null);

const makeSupabaseClient = (getToken) => {
    return createClient(
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
};


export const SupabaseProvider = ({ children }) => {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    return makeSupabaseClient(getToken);
  }, [getToken]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  return useContext(SupabaseContext);
};
