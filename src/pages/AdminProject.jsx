import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const AdminProject = () => {
  const supabase = useSupabase();
  const [projects, setProjects] = useState([]);
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

      const userIds = [...new Set(projectsData.map(p => p.user_id))];
      if (userIds.length === 0) {
        setProjects([]);
        return;
      }

      // 2. Fetch user profiles for phone numbers and member_name
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('user_id, phone_number, member_name') // member_name 추가
        .in('user_id', userIds);
      if (profilesError) throw profilesError;
      const profilesMap = new Map(profilesData.map(p => [p.user_id, p]));

      // 3. Fetch Clerk user details for center names (username)
      const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) throw new Error('Failed to fetch user details');
      const usersData = await response.json();

      // 4. Combine all data
      const combinedData = projectsData.map(project => ({
        ...project,
        center_name: usersData[project.user_id]?.username || 'N/A', // 센터명 (Clerk username)
        member_name: profilesMap.get(project.user_id)?.member_name || 'N/A', // 담당자명 (Supabase profile)
        phone_number: profilesMap.get(project.user_id)?.phone_number || '없음',
      }));

      setProjects(combinedData);

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'project_complete':
        return 'success';
      case 'script_needed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-2 text-white">전체 프로젝트 목록</h1>
      <p className="text-lg text-slate-400 mb-8">시스템에 등록된 모든 프로젝트를 조회합니다.</p>
      
      <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <p className="p-6 text-center">프로젝트 목록을 불러오는 중...</p>
        ) : error ? (
          <p className="p-6 text-center text-red-400">오류: {error}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">번호</TableHead>
                <TableHead>프로젝트 이름</TableHead>
                <TableHead>센터명</TableHead>
                <TableHead>담당자명</TableHead>
                <TableHead>연락처</TableHead>
                <TableHead>상태</TableHead>
                <TableHead className="text-right">생성일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project, index) => (
                <TableRow key={project.id}>
                  <TableCell className="font-medium">{projects.length - index}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.center_name}</TableCell>
                  <TableCell>{project.member_name}</TableCell>
                  <TableCell>{project.phone_number}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(project.status)}>{project.status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{new Date(project.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
         { !isLoading && projects.length === 0 && <p className="p-6 text-center text-slate-500">표시할 프로젝트가 없습니다.</p>}
      </div>
    </div>
  );
};

export default AdminProject;