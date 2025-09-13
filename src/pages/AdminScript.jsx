import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../components/SupabaseProvider';

// Helper function
const extractTextFromLexical = (json) => {
  let text = '';
  try {
    const parsedJson = typeof json === 'string' ? JSON.parse(json) : json;
    if (parsedJson && parsedJson.root && parsedJson.root.children) {
      for (const rootChild of parsedJson.root.children) {
        if (rootChild.type === 'script-container' && rootChild.children) {
          for (const containerChild of rootChild.children) {
            if (containerChild.children) {
              for (const innerChild of containerChild.children) {
                if (innerChild.type === 'text') text += innerChild.text + ' ';
              }
            }
          }
        } else if (rootChild.children) {
          for (const innerChild of rootChild.children) {
            if (innerChild.type === 'text') text += innerChild.text + ' ';
          }
        }
        if (text.length > 100) break;
      }
    }
  } catch (e) {
    console.error("Failed to parse Lexical content for preview", e);
    return "(미리보기를 생성할 수 없습니다)";
  }
  return text.trim();
};

const AdminScript = () => {
  const { user } = useUser();
  const supabase = useSupabase();

  const [groupedScripts, setGroupedScripts] = useState({});
  const [userNamesMap, setUserNamesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfiles, setUserProfiles] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  const fetchUserProfiles = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data: profilesData, error: profilesError } = await supabase.from('user_profiles').select('user_id, member_name').order('member_name', { ascending: true });
      if (profilesError) throw profilesError;

      const { data: clerkUsersData, error: clerkUsersError } = await supabase.functions.invoke('get-all-clerk-users', { method: 'GET' });
      if (clerkUsersError) throw clerkUsersError;

      const clerkUsernameMap = new Map(clerkUsersData.map(u => [u.id, u.username]));
      const combinedProfiles = profilesData.map(profile => ({ ...profile, username: clerkUsernameMap.get(profile.user_id) || profile.member_name }));
      setUserProfiles(combinedProfiles || []);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
    }
  }, [supabase]);

  const fetchData = useCallback(async () => {
    if(!supabase) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('scripts')
        .select('id, title, content, updated_at, status, user_id, submitted_at')
        .neq('status', 'draft');
      if (scriptsError) throw scriptsError;

      const scriptsByUser = (scriptsData || []).reduce((acc, script) => {
        if (!acc[script.user_id]) acc[script.user_id] = [];
        acc[script.user_id].push(script);
        return acc;
      }, {});
      setGroupedScripts(scriptsByUser);

      const scriptUserIds = (scriptsData || []).map(s => s.user_id);
      const uniqueUserIds = [...new Set(scriptUserIds)];

      if (uniqueUserIds.length > 0) {
        const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!response.ok) throw new Error('Failed to fetch user details');
        const usersData = await response.json();
        setUserNamesMap(usersData);

        if (Object.keys(scriptsByUser).length > 0) {
          setSelectedUserId(Object.keys(scriptsByUser)[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching script data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase && user) {
      fetchData();
      fetchUserProfiles();
    }
  }, [supabase, user, fetchData, fetchUserProfiles]);

  useEffect(() => {
    if (!supabase || !selectedUserId) {
      setSelectedUserProfile(null);
      return;
    }
    const fetchUserProfile = async () => {
      const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', selectedUserId).single();
      if (error && error.code !== 'PGRST116') console.error('Error fetching profile:', error);
      else setSelectedUserProfile(data);
    };
    fetchUserProfile();
  }, [supabase, selectedUserId]);

  const handleUpdateScriptStatus = async (scriptId, newStatus) => {
    const { error } = await supabase.from('scripts').update({ status: newStatus }).eq('id', scriptId);
    if (error) alert(`대본 상태 업데이트 실패: ${error.message}`);
    else {
      alert('대본 상태가 업데이트되었습니다!');
      fetchData(); // Refresh data
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-white">센터별 상세 조회</h1>
      <p className="text-lg text-slate-400 mb-8">특정 센터의 대본 목록을 확인하고 관리합니다.</p>
      <div className="mt-8 p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-lg flex h-[70vh]">
        {isLoading ? (
          <p className="text-slate-300">로딩 중...</p>
        ) : error ? (
          <p className="text-red-400">오류: {error}</p>
        ) : (
          <>
            {/* Column 1: All Centers */}
            <div className="w-1/6 border-r border-slate-700 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">전체 센터</h2>
              <ul className="space-y-2">
                {userProfiles.map((profile) => (
                  <li key={profile.user_id} onClick={() => setSelectedUserId(profile.user_id)} className={`p-2 cursor-pointer rounded-md ${selectedUserId === profile.user_id ? 'bg-blue-900 bg-opacity-50 text-blue-200' : 'hover:bg-slate-800'}`}>
                    {profile.username || profile.user_id}
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 2: Center Details */}
            <div className="w-1/6 border-r border-slate-700 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">센터 정보</h2>
              {selectedUserProfile ? (
                <div className="p-3 bg-slate-800 rounded-md">
                  <h3 className="font-bold text-lg text-white">{selectedUserProfile.member_name}</h3>
                  <p className="text-sm text-slate-300 mt-2">담당자: {userNamesMap[selectedUserId]?.username || selectedUserId}</p>
                  <p className="text-sm text-slate-300">연락처: {selectedUserProfile.phone_number || '없음'}</p>
                </div>
              ) : (
                <p className="text-slate-400 text-sm">센터를 선택하세요.</p>
              )}
            </div>

            {/* Column 3: Submitted Scripts */}
            <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">접수된 대본</h2>
              {selectedUserId && groupedScripts[selectedUserId] ? (
                <ul className="space-y-2">
                  {groupedScripts[selectedUserId].map((script) => (
                    <li key={script.id} onClick={() => setSelectedScriptId(script.id)} className={`p-2 cursor-pointer rounded-md ${selectedScriptId === script.id ? 'bg-blue-900 bg-opacity-50 text-blue-200' : 'hover:bg-slate-800'}`}>
                      <h3 className="font-bold text-white text-base">{script.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">상태: {script.status} | 수정: {new Date(script.updated_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400 text-sm">접수된 대본이 없습니다.</p>
              )}
            </div>

            {/* Column 4: Script Detail */}
            <div className="w-1/3 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">대본 내용</h2>
              {selectedScriptId ? (() => {
                  const script = groupedScripts[selectedUserId]?.find(s => s.id === selectedScriptId);
                  if (!script) return <p>대본을 선택해주세요.</p>;
                  return (
                    <div>
                      <h3 className="font-bold text-white text-lg mb-2">{script.title}</h3>
                      <p className="text-slate-300 mb-4">{extractTextFromLexical(script.content) || '(내용 없음)'}</p>
                      <div className="mt-4 flex space-x-2">
                        <button onClick={() => handleUpdateScriptStatus(script.id, 'under_review')} className={`px-3 py-1 text-sm rounded bg-yellow-500 hover:bg-yellow-600 text-white`}>검토 중</button>
                        <button onClick={() => handleUpdateScriptStatus(script.id, 'approved')} className={`px-3 py-1 text-sm rounded bg-green-500 hover:bg-green-600 text-white`}>승인</button>
                      </div>
                    </div>
                  );
                })() : <p>대본을 선택해주세요.</p>}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminScript;