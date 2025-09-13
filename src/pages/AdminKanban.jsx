import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../components/SupabaseProvider';
import ProjectCard from '../components/ProjectCard';

const AdminKanban = () => {
  const { user } = useUser();
  const supabase = useSupabase();

  const [projects, setProjects] = useState([]);
  const [userNamesMap, setUserNamesMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
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

      // 2. Fetch user names for the projects
      const projectUserIds = projectsData.map(p => p.user_id);
      const uniqueUserIds = [...new Set(projectUserIds)];

      if (uniqueUserIds.length > 0) {
        const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userIds: uniqueUserIds }),
        });
        if (!response.ok) throw new Error('Failed to fetch user details');
        const usersData = await response.json();
        setUserNamesMap(usersData);
      }
    } catch (err) {
      console.error('Error fetching kanban data:', err);
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

  const handleDataRefresh = () => {
    fetchData();
  };

  const handleUpdateProjectStatus = async (projectId, newStatus) => {
    const { error } = await supabase.from('projects').update({ status: newStatus }).eq('id', projectId);
    if (error) alert(`프로젝트 상태 업데이트 실패: ${error.message}`);
    else {
      alert('프로젝트 상태가 업데이트되었습니다!');
      handleDataRefresh();
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

  const statusMap = new Map(kanbanColumns.map(c => [c.id, c.title]));

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
                    statusDisplayName={statusMap.get(project.status) || project.status}
                    onCenterClick={() => {}} // onCenterClick is not needed here
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
    </div>
  );
};

export default AdminKanban;