import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUserCache } from '@/contexts/UserCacheContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { toast } from 'sonner';
import { ExternalLink, StickyNote, Loader2 } from 'lucide-react';
import { PROJECT_STATUSES, STATUS_MAP } from '@/data/projectStatuses.js';

// Define the statuses that belong to the editing phase
const EDITING_STATUSES = [
  'shoot_completed',
  'video_draft_1',
  'feedback_complete',
  'video_edit_uploaded',
  'project_complete'
];

const AdminEdit = () => {
  const supabase = useSupabase();
  const { userCache, isLoading: isUserCacheLoading } = useUserCache();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEditingProjects = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, user_profiles(info, contact_history)')
        .in('status', EDITING_STATUSES)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data);
    } catch (err) {
      toast.error('편집 프로젝트를 불러오는 데 실패했습니다.', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchEditingProjects();
  }, [fetchEditingProjects]);

  const handleStatusChange = async (projectId, newStatus) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      if (error) throw error;
      toast.success('프로젝트 상태가 업데이트되었습니다.');
      fetchEditingProjects(); // Refresh data
    } catch (err) {
      toast.error('상태 업데이트에 실패했습니다.', { description: err.message });
    }
  };

  const handleLinkUpdate = async (projectId, newLink) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ frame_io_link: newLink, updated_at: new Date().toISOString() })
        .eq('id', projectId);
      if (error) throw error;
      toast.success('Frame.io 링크가 업데이트되었습니다.');
      fetchEditingProjects(); // Refresh data
    } catch (err) {
      toast.error('링크 업데이트에 실패했습니다.', { description: err.message });
    }
  };

  if (isLoading || isUserCacheLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-white mb-2">편집 관리</h1>
      <p className="text-lg text-slate-400 mb-8">촬영이 완료된 프로젝트의 편집 과정을 관리합니다.</p>

      <div className="bg-card p-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>센터명</TableHead>
              <TableHead>프로젝트명</TableHead>
              <TableHead>현재 상태</TableHead>
              <TableHead>Frame.io</TableHead>
              <TableHead>메모</TableHead>
              <TableHead>최신 업데이트</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map(project => (
              <TableRow key={project.id}>
                <TableCell className="font-medium">{userCache[project.user_id] || '...'}</TableCell>
                <TableCell>{project.name}</TableCell>
                <TableCell>
                  <Select value={project.status} onValueChange={(newStatus) => handleStatusChange(project.id, newStatus)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">링크 관리</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">Frame.io 링크</h4>
                          <p className="text-sm text-muted-foreground">리뷰를 위한 링크를 입력하세요.</p>
                        </div>
                        <Input 
                          defaultValue={project.frame_io_link || ''} 
                          onBlur={(e) => handleLinkUpdate(project.id, e.target.value)}
                        />
                        {project.frame_io_link && (
                           <Button asChild variant="secondary" size="sm">
                            <a href={project.frame_io_link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" /> 링크 열기
                            </a>
                          </Button>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon"><StickyNote className="h-4 w-4" /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-96">
                      <div className="space-y-4">
                        <div>
                          <h5 className="font-semibold mb-2">특이사항</h5>
                          <p className="text-sm text-muted-foreground bg-slate-800 p-2 rounded-md">{project.user_profiles?.info || '내용 없음'}</p>
                        </div>
                        <div>
                          <h5 className="font-semibold mb-2">컨택 히스토리</h5>
                          <p className="text-sm text-muted-foreground bg-slate-800 p-2 rounded-md">{project.user_profiles?.contact_history || '내용 없음'}</p>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </TableCell>
                <TableCell>{new Date(project.updated_at).toLocaleDateString('ko-KR')}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminEdit;