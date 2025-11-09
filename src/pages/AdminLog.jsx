import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUserCache } from '@/contexts/UserCacheContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight } from 'lucide-react';
import { STATUS_MAP } from '@/data/projectStatuses.js';
import { toast } from 'sonner';

const AdminLog = () => {
  const supabase = useSupabase();
  const { userCache, isLoading: isUserCacheLoading, getUserNames } = useUserCache();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_activity_logs');
      if (error) throw error;

      // Collect all unique actor IDs to fetch their names
      const actorIds = [...new Set(data.map(log => log.actor_user_id).filter(Boolean))];
      if (actorIds.length > 0) {
        await getUserNames(actorIds);
      }

      setLogs(data);
    } catch (err) {
      toast.error('활동 로그를 불러오는 데 실패했습니다.', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, getUserNames]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getStatusVariant = (status) => {
    if (!status) return 'secondary';
    switch (status) {
      case 'project_complete':
      case 'schedule_fixed':
        return 'success';
      case 'project_cancled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (isLoading || isUserCacheLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-white mb-2">프로젝트 활동 로그</h1>
      <p className="text-lg text-slate-400 mb-8">모든 프로젝트의 상태 변경 이력을 추적합니다.</p>

      <div className="bg-card p-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">시간</TableHead>
              <TableHead>프로젝트</TableHead>
              <TableHead>변경자</TableHead>
              <TableHead>상세 내용</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.log_id}>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(log.created_at).toLocaleString('ko-KR')}
                </TableCell>
                <TableCell className="font-medium">{log.project_name || 'N/A'}</TableCell>
                <TableCell>{userCache[log.actor_user_id]?.username || log.actor_user_id || '시스템'}</TableCell>
                <TableCell>
                  {log.description ? (
                    <span className="text-sm">{log.description}</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(log.old_status)}>
                        {STATUS_MAP.get(log.old_status) || log.old_status || '없음'}
                      </Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <Badge variant={getStatusVariant(log.new_status)}>
                        {STATUS_MAP.get(log.new_status) || log.new_status}
                      </Badge>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminLog;