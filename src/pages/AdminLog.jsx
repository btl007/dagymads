import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUserCache } from '@/contexts/UserCacheContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, PlusCircle, Pencil, Trash2, Lock, FileText, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { STATUS_MAP } from '@/data/projectStatuses.js';

// 1. 필드 및 값 매핑 상수 정의
const FIELD_LABELS = {
  status: '진행 상태',
  shootdate: '촬영일',
  center_name: '센터명',
  member_name: '담당자',
  phone_number: '연락처',
  address: '주소',
  info: '특이사항',
  frame_io_link: 'Frame.io 링크',
  youtube_link: 'YouTube 링크',
  contact_history: '컨택 히스토리',
  camera_crew: '촬영팀',
  name: '프로젝트명',
  title: '제목',
  content: '내용',
  is_open: '예약 가능 여부',
  booking_status: '예약 상태',
};

const getReadableValue = (key, value) => {
  if (value === null || value === undefined) return '없음';
  
  // Boolean 처리
  if (typeof value === 'boolean') {
    if (key === 'is_open') return value ? '열림' : '닫힘';
    return value ? 'True' : 'False';
  }

  if (key === 'status') return STATUS_MAP.get(value) || value;
  if (key === 'shootdate' || key.includes('_at')) {
    try {
      return new Date(value).toLocaleDateString();
    } catch {
      return value;
    }
  }
  return value;
};

// 2. 스마트 변경 내역 컴포넌트
const SmartChangeDetails = ({ changes, action }) => {
  if (!changes || Object.keys(changes).length === 0) return <span className="text-muted-foreground">-</span>;

  // 비밀번호 초기화 등 특정 메시지 처리
  if (changes.description) {
    return <span className="text-sm font-medium">{changes.description}</span>;
  }

  // 생성(INSERT)의 경우
  if (action === 'INSERT') {
    return <span className="text-sm text-muted-foreground">새로운 데이터가 생성되었습니다.</span>;
  }

  // 수정(UPDATE)의 경우
  return (
    <div className="flex flex-col gap-1 text-sm">
      {Object.entries(changes).map(([key, value]) => {
        // 무시할 필드 (예: updated_at)
        if (key === 'updated_at') return null;

        const label = FIELD_LABELS[key] || key;
        const oldVal = getReadableValue(key, value.old);
        const newVal = getReadableValue(key, value.new);

        // 긴 텍스트 필드는 간략히 표시
        if (['info', 'contact_history', 'content'].includes(key)) {
          return (
            <div key={key} className="flex items-center gap-2">
              <span className="font-semibold text-slate-300 min-w-[80px]">{label}</span>
              <span className="text-muted-foreground">내용이 수정되었습니다.</span>
            </div>
          );
        }

        return (
          <div key={key} className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-300 min-w-[80px]">{label}</span>
            <span className="text-muted-foreground line-through decoration-red-500/50 decoration-2">{oldVal}</span>
            <ArrowRight className="h-3 w-3 text-slate-500" />
            <span className="font-bold text-green-400">{newVal}</span>
          </div>
        );
      })}
    </div>
  );
};

const ActionIcon = ({ action }) => {
  switch (action) {
    case 'INSERT': return <PlusCircle className="h-4 w-4 text-green-500" />;
    case 'UPDATE': return <Pencil className="h-4 w-4 text-blue-500" />;
    case 'DELETE': return <Trash2 className="h-4 w-4 text-red-500" />;
    case 'RESET_PASSWORD': return <Lock className="h-4 w-4 text-orange-500" />;
    default: return <Activity className="h-4 w-4 text-slate-500" />;
  }
};

const AdminLog = () => {
  const supabase = useSupabase();
  const { userCache, isLoading: isUserCacheLoading, getUserNames } = useUserCache();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [projectNames, setProjectNames] = useState({}); // project_id -> name 매핑
  const [timeSlotTimes, setTimeSlotTimes] = useState({}); // slot_id -> time 매핑

  const fetchLogs = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // 1. Actor 이름 가져오기
      const actorIds = [...new Set(data.map(log => log.actor_id).filter(id => id && id !== 'system'))];
      if (actorIds.length > 0) {
        await getUserNames(actorIds);
      }

      // 2. Project 이름 가져오기
      const projectIds = [...new Set(data
        .filter(log => log.target_table === 'projects')
        .map(log => log.target_id)
      )];

      if (projectIds.length > 0) {
        const { data: projectsData } = await supabase
          .from('projects')
          .select('id, name')
          .in('id', projectIds);
        
        const projectMap = (projectsData || []).reduce((acc, p) => {
          acc[p.id] = p.name;
          return acc;
        }, {});
        setProjectNames(projectMap);
      }

      // 3. Time Slot 시간 가져오기
      const timeSlotIds = [...new Set(data
        .filter(log => log.target_table === 'time_slots')
        .map(log => log.target_id)
      )];

      if (timeSlotIds.length > 0) {
        // ID가 숫자형일 수 있으므로 변환 필요할 수 있음 (audit_logs에는 TEXT로 저장됨)
        // time_slots.id는 bigint이므로 text로 캐스팅해서 비교하거나, 그냥 숫자로 변환해서 조회
        // Supabase .in() handles mixed types well usually, but safer to parse.
        const parsedIds = timeSlotIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
        
        if (parsedIds.length > 0) {
            const { data: slotsData } = await supabase
            .from('time_slots')
            .select('id, slot_time')
            .in('id', parsedIds);
            
            const slotMap = (slotsData || []).reduce((acc, s) => {
            acc[s.id] = s.slot_time;
            return acc;
            }, {});
            setTimeSlotTimes(slotMap);
        }
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

  const getTargetName = (log) => {
    if (log.target_table === 'projects') {
      return (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-200">{projectNames[log.target_id] || '삭제된 프로젝트'}</span>
          <span className="text-xs text-muted-foreground">ID: {log.target_id.slice(0, 8)}...</span>
        </div>
      );
    }
    if (log.target_table === 'clerk_users' || log.target_table === 'user_profiles') {
        const userName = userCache[log.target_id]?.username;
        return (
            <div className="flex flex-col">
              <span className="font-semibold text-slate-200">{userName || '사용자'}</span>
              <span className="text-xs text-muted-foreground">ID: {log.target_id.slice(0, 10)}...</span>
            </div>
        );
    }
    if (log.target_table === 'time_slots') {
        const slotTime = timeSlotTimes[log.target_id];
        return (
            <div className="flex flex-col">
                <span className="font-semibold text-slate-200">
                    {slotTime ? new Date(slotTime).toLocaleString('ko-KR', {
                        year: '2-digit', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    }) : '시간 슬롯'}
                </span>
                <span className="text-xs text-muted-foreground">ID: {log.target_id}</span>
            </div>
        );
    }
    return <span className="font-mono text-xs">{log.target_table}:{log.target_id}</span>;
  };

  if (isLoading || isUserCacheLoading) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-3xl font-bold text-white mb-2">통합 감사 로그</h1>
      <p className="text-lg text-slate-400 mb-8">시스템의 모든 데이터 변경 이력을 추적합니다.</p>

      <div className="bg-card p-4 rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">시간</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              <TableHead className="w-[120px]">수행자</TableHead>
              <TableHead className="w-[200px]">대상 (프로젝트/사용자)</TableHead>
              <TableHead>변경 내역</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map(log => (
              <TableRow key={log.id}>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {new Date(log.created_at).toLocaleString('ko-KR', {
                    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                  })}
                </TableCell>
                <TableCell>
                  <ActionIcon action={log.action_type} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal text-slate-400">
                    {log.actor_id === 'system' ? '시스템' : (userCache[log.actor_id]?.username || '관리자')}
                  </Badge>
                </TableCell>
                <TableCell>
                  {getTargetName(log)}
                </TableCell>
                <TableCell>
                  <SmartChangeDetails changes={log.changes} action={log.action_type} />
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