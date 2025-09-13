import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

const AdminUsers = () => {
  const supabase = useSupabase();
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfiles = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, member_name, phone_number, created_at')
        .order('created_at', { ascending: false });
      if (profilesError) throw profilesError;

      const { data: clerkUsersData, error: clerkUsersError } = await supabase.functions.invoke('get-all-clerk-users', { method: 'GET' });
      if (clerkUsersError) throw clerkUsersError;

      const clerkUsernameMap = new Map(clerkUsersData.map(u => [u.id, u.username]));
      const combinedProfiles = profilesData.map(profile => ({
        ...profile,
        username: clerkUsernameMap.get(profile.user_id) || 'N/A',
      }));

      setUserProfiles(combinedProfiles || []);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserProfiles();
  }, [fetchUserProfiles]);

  return (
    <div className="p-8">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold text-white">사용자 목록</h1>
                <p className="text-lg text-slate-400">현재 등록된 모든 사용자 목록입니다.</p>
            </div>
            <Link to="/admin/createusers">
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    새 사용자 추가
                </Button>
            </Link>
          </div>
          <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg p-4 h-[70vh] overflow-y-auto">
            {isLoading ? (
              <p>Loading users...</p>
            ) : (
              <ul className="space-y-3">
                {userProfiles.map(profile => (
                  <li key={profile.user_id} className="p-3 bg-slate-800 rounded-md flex justify-between items-center">
                    <div>
                      <p className="font-bold text-white">{profile.member_name}</p>
                      <p className="text-sm text-slate-300">@{profile.username}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400">{profile.phone_number || '연락처 없음'}</p>
                        <p className="text-xs text-slate-500">가입: {new Date(profile.created_at).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
    </div>
  );
};

export default AdminUsers;
