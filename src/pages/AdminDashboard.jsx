import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useSupabase } from '../components/SupabaseProvider';
import AddUserForm from '../components/AddUserForm';
import ProjectCard from '../components/ProjectCard';

// Helper function from original component (can be moved to a utils file later)
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

const AdminDashboard = () => {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const supabase = useSupabase();

  // State for both views
  const [projects, setProjects] = useState([]);
  const [groupedScripts, setGroupedScripts] = useState({});
  const [userNamesMap, setUserNamesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for Column View selection
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedScriptId, setSelectedScriptId] = useState(null);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // 2. Fetch all non-draft scripts
      const { data: scriptsData, error: scriptsError } = await supabase
        .from('scripts')
        .select('id, title, content, updated_at, status, user_id, submitted_at')
        .neq('status', 'draft');
      if (scriptsError) throw scriptsError;

      // 3. Group scripts by user for Column View
      const scriptsByUser = (scriptsData || []).reduce((acc, script) => {
        if (!acc[script.user_id]) acc[script.user_id] = [];
        acc[script.user_id].push(script);
        return acc;
      }, {});
      setGroupedScripts(scriptsByUser);

      // 4. Aggregate all unique user IDs and fetch their names
      const projectUserIds = projectsData.map(p => p.user_id);
      const scriptUserIds = (scriptsData || []).map(s => s.user_id);
      const uniqueUserIds = [...new Set([...projectUserIds, ...scriptUserIds])];

      if (uniqueUserIds.length > 0) {
        const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!response.ok) throw new Error('Failed to fetch user details');
        const usersData = await response.json();
        setUserNamesMap(usersData);

        // Set initial selection for column view
        if (Object.keys(scriptsByUser).length > 0) {
          setSelectedUserId(Object.keys(scriptsByUser)[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    if (supabase && user) {
      fetchData();
    }
  }, [supabase, user, fetchData]);

  // Effect for Column View: fetch user profile when a user is selected
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

  // Handler for Kanban View
  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (error) alert(`프로젝트 상태 업데이트 실패: ${error.message}`);
    else {
      alert('프로젝트 상태가 업데이트되었습니다!');
      fetchData(); // Refresh all data
    }
  };

  // Handler for Column View
  const handleUpdateScriptStatus = async (scriptId, newStatus) => {
    const { error } = await supabase.from('scripts').update({ status: newStatus }).eq('id', scriptId);
    if (error) alert(`대본 상태 업데이트 실패: ${error.message}`);
    else {
      alert('대본 상태가 업데이트되었습니다!');
      fetchData(); // Refresh all data
    }
  };
  
  const projectsByStatus = projects.reduce((acc, project) => {
    const status = project.status || 'script_needed';
    if (!acc[status]) acc[status] = [];
    acc[status].push(project);
    return acc;
  }, {});

  const kanbanColumns = [
    { id: 'script_needed', title: '대본 필요' },
    { id: 'script_submitted', title: '대본 접수' },
    { id: 'video_draft_1', title: '영상 초안' },
    { id: 'feedback_complete', title: '피드백 완료' },
    { id: 'project_complete', title: '최종 완료' },
  ];

  if (!isLoaded) return <div>Loading...</div>;
  if (!user || !user.publicMetadata.is_admin) return <div>Access Denied.</div>;

  return (
    <div className="p-8">
      {/* Kanban View */}
      <h1 className="text-3xl font-bold mb-2 text-white">프로젝트 칸반 보드</h1>
      <p className="text-lg text-slate-400 mb-8">전체 영상 제작 과정을 관리합니다.</p>
      {isLoading ? (
        <p className="text-slate-300">프로젝트 로딩 중...</p>
      ) : error ? (
        <p className="text-red-400">오류: {error}</p>
      ) : (
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {kanbanColumns.map(column => (
            <div key={column.id} className="bg-slate-900 w-80 flex-shrink-0 rounded-lg p-4">
              <h3 className="text-lg font-bold text-white mb-4">{column.title}</h3>
              <div className="space-y-4 h-full overflow-y-auto">
                {(projectsByStatus[column.id] || []).map(project => (
                  <ProjectCard 
                    key={project.id} 
                    project={project} 
                    userName={userNamesMap[project.user_id]?.username || project.user_id}
                    onUpdateStatus={handleUpdateProjectStatus}
                  />
                ))}
                {(!projectsByStatus[column.id] || projectsByStatus[column.id].length === 0) && (
                  <div className="text-center py-4"><p className="text-sm text-slate-500">해당 프로젝트 없음</p></div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <hr className="my-12 border-slate-700" />

      {/* Column View */}
      <h1 className="text-3xl font-bold mb-2 text-white">센터별 상세 조회</h1>
      <p className="text-lg text-slate-400 mb-8">특정 센터의 대본 목록을 확인하고 관리합니다.</p>
      <div className="mt-8 p-6 bg-slate-900 border border-slate-700 rounded-lg shadow-lg flex h-[70vh]">
        {isLoading ? (
          <p className="text-slate-300">로딩 중...</p>
        ) : error ? (
          <p className="text-red-400">오류: {error}</p>
        ) : Object.keys(groupedScripts).length === 0 ? (
          <p className="text-slate-300">접수된 대본이 없습니다.</p>
        ) : (
          <>
            <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">센터 목록</h2>
              <ul className="space-y-2">
                {Object.keys(groupedScripts).map((userId) => (
                  <li key={userId} onClick={() => setSelectedUserId(userId)} className={`p-2 cursor-pointer rounded-md ${selectedUserId === userId ? 'bg-blue-900 bg-opacity-50 text-blue-200' : 'hover:bg-slate-800'}`}>
                    {userNamesMap[userId]?.username || userId}
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-1/3 border-r border-slate-700 p-4 overflow-y-auto">
              <h2 className="text-xl text-white font-semibold mb-4">대본 목록</h2>
              {selectedUserId && selectedUserProfile && (
                <div className="mb-4 p-3 bg-slate-800 rounded-md">
                  <h3 className="font-bold text-lg text-white">{userNamesMap[selectedUserId]?.username || selectedUserId}</h3>
                  <p className="text-sm text-slate-300">담당자: {selectedUserProfile.member_name || '없음'}</p>
                  <p className="text-sm text-slate-300">연락처: {selectedUserProfile.phone_number || '없음'}</p>
                </div>
              )}
              {selectedUserId && groupedScripts[selectedUserId] && (
                <ul className="space-y-2">
                  {groupedScripts[selectedUserId].map((script) => (
                    <li key={script.id} onClick={() => setSelectedScriptId(script.id)} className={`p-2 cursor-pointer rounded-md ${selectedScriptId === script.id ? 'bg-blue-900 bg-opacity-50 text-blue-200' : 'hover:bg-slate-800'}`}>
                      <h3 className="font-bold text-white text-base">{script.title}</h3>
                      <p className="text-xs text-slate-400 mt-1">상태: {script.status} | 수정: {new Date(script.updated_at).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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

      <div className="mt-12">
        <AddUserForm />
      </div>
    </div>
  );
};

export default AdminDashboard;
