
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { useUserCache } from '../contexts/UserCacheContext';
import { STATUS_MAP } from '../data/projectStatuses.js';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from 'lucide-react';
import ProjectInfoModal from '../components/ProjectInfoModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const AdminProject = () => {
  const supabase = useSupabase();
  const { userCache, getUserNames } = useUserCache();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, user_profiles(center_name, member_name, phone_number, address, info)')
        .order('created_at', { ascending: false });
      if (projectsError) throw projectsError;

      const userIds = [...new Set(projectsData.map(p => p.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        await getUserNames(userIds);
      }
      
      setProjects(projectsData);

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, getUserNames]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredProjects = useMemo(() => {
    if (!searchTerm) return projects;
    const lowerTerm = searchTerm.toLowerCase();
    return projects.filter(project => {
      const centerName = project.user_profiles?.center_name || '';
      const memberName = project.user_profiles?.member_name || '';
      const username = userCache[project.user_id]?.username || '';
      const projectName = project.name || '';

      return (
        centerName.toLowerCase().includes(lowerTerm) ||
        memberName.toLowerCase().includes(lowerTerm) ||
        username.toLowerCase().includes(lowerTerm) ||
        projectName.toLowerCase().includes(lowerTerm)
      );
    });
  }, [projects, searchTerm, userCache]);

  const handleRowClick = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    fetchData(); // Refresh data after closing modal
  };

  const handleProjectSave = async (projectChanges, profileChanges) => {
    if (!supabase) return;
    try {
      // Update projects table
      const { error: projectError } = await supabase
        .from('projects')
        .update(projectChanges)
        .eq('id', projectChanges.id);

      if (projectError) throw projectError;

      // Update user_profiles table if profileChanges exists
      if (profileChanges) {
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update(profileChanges)
          .eq('user_id', profileChanges.user_id);
        
        if (profileError) throw profileError;
      }

      toast.success('프로젝트가 성공적으로 저장되었습니다.');
      handleCloseModal(); // Close modal and refresh data
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('저장 중 오류 발생: ' + error.message);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'project_complete': return 'success';
      case 'script_needed': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-2 text-white">전체 프로젝트 목록</h1>
        <p className="text-lg text-slate-400 mb-8">시스템에 등록된 모든 프로젝트를 조회합니다.</p>
        <div className="bg-slate-900 border border-slate-700 rounded-lg shadow-lg overflow-hidden p-4 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8"><p className="text-red-400">데이터 로딩 중 오류 발생: {error}</p></div>
  }

  return (
    <div className="p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-white">전체 프로젝트 목록</h1>
          <p className="text-lg text-slate-400">시스템에 등록된 모든 프로젝트를 조회합니다.</p>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="프로젝트명, 센터명, 담당자 검색..." 
            className="pl-8 bg-slate-900 border-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="bg-card p-4 rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>번호</TableHead>
                <TableHead>센터명</TableHead>
                <TableHead>프로젝트명</TableHead>
                <TableHead>센터 담당자</TableHead>
                <TableHead>담당자 연락처</TableHead>
                <TableHead>촬영일자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>더보기</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project, index) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="font-medium">{project.user_profiles?.center_name || '이름 없음'}</div>
                      <div className="text-xs text-muted-foreground">{userCache[project.user_id]?.username || 'ID 없음'}</div>
                    </TableCell>
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.user_profiles?.member_name || 'N/A'}</TableCell>
                    <TableCell>{project.user_profiles?.phone_number || '없음'}</TableCell>
                    <TableCell>{project.shootdate ? new Date(project.shootdate).toLocaleDateString() : '미정'}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(project.status)}>
                        {STATUS_MAP.get(project.status) || project.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleRowClick(project)}>
                        더보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    검색 결과가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedProject && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>프로젝트 상세 정보</DialogTitle>
              <DialogDescription>
                프로젝트의 상세 정보를 확인하고 수정할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <ProjectInfoModal
              project={selectedProject}
              onClose={handleCloseModal}
              onSave={handleProjectSave}
              userName={userCache[selectedProject.user_id]?.username}
              onDataRefresh={fetchData} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminProject;
