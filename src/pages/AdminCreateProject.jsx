import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider';
import AddProjectForm from '../components/AddProjectForm';

const AdminCreateProject = () => {
  const navigate = useNavigate();
  const supabase = useSupabase();
  const [userProfiles, setUserProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfiles = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, member_name')
        .order('member_name', { ascending: true });
      if (profilesError) throw profilesError;

      const { data: clerkUsersData, error: clerkUsersError } = await supabase.functions.invoke('get-all-clerk-users', { method: 'GET' });
      if (clerkUsersError) throw clerkUsersError;

      const clerkUsernameMap = new Map(clerkUsersData.map(u => [u.id, u.username]));
      const combinedProfiles = profilesData.map(profile => ({
        ...profile,
        username: clerkUsernameMap.get(profile.user_id) || profile.member_name,
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

  const handleProjectAdded = () => {
    alert('새로운 프로젝트가 성공적으로 추가되었습니다.');
    navigate('/admin'); // 프로젝트 추가 후, 개요 페이지로 이동
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2 text-white">새 프로젝트 추가</h1>
        <p className="text-lg text-slate-400 mb-8">특정 센터(사용자)에게 새 영상 제작 프로젝트를 할당합니다.</p>
        {isLoading ? (
            <p>사용자 목록을 불러오는 중...</p>
        ) : (
            <AddProjectForm userProfiles={userProfiles} onProjectAdded={handleProjectAdded} />
        )}
      </div>
    </div>
  );
};

export default AdminCreateProject;