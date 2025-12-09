import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useSupabase } from '@/components/SupabaseProvider';
import { useUserCache } from '@/contexts/UserCacheContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Users, FileText, Video, CheckCircle, Clock, ArrowRight, Activity, Calendar, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { STATUS_MAP } from '@/data/projectStatuses.js';
import { toast } from 'sonner';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, icon: Icon, description, trend, colorClass }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">
        {description}
      </p>
    </CardContent>
  </Card>
);

const AdminOverview = () => {
  const supabase = useSupabase();
  const { userCache, getUserNames } = useUserCache();
  
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    scriptPending: 0,
    schedulePending: 0,
    upcomingShootsCount: 0,
  });
  const [projectStatusData, setProjectStatusData] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [upcomingShoots, setUpcomingShoots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      // 1. Projects Data
      const { data: projects, error: projectsError } = await supabase
        .from('projects')
        .select('*');
      if (projectsError) throw projectsError;

      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status !== 'project_complete' && p.status !== 'project_cancled').length;
      
      // Status Distribution for Chart
      const statusCounts = projects.reduce((acc, p) => {
        const statusName = STATUS_MAP.get(p.status) || p.status;
        acc[statusName] = (acc[statusName] || 0) + 1;
        return acc;
      }, {});
      
      const chartData = Object.entries(statusCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value); // Sort by count desc

      setProjectStatusData(chartData);

      // 2. Scripts Pending (submitted or under_review)
      const { count: scriptPendingCount } = await supabase
        .from('scripts')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review']);

      // 3. Schedule Pending (requested slots)
      const { count: schedulePendingCount } = await supabase
        .from('time_slots')
        .select('*', { count: 'exact', head: true })
        .eq('booking_status', 'requested');

      // 4. Upcoming Shoots (Next 30 days)
      const today = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(today.getDate() + 30);
      
      const { data: shootsData } = await supabase
        .from('projects')
        .select('*, time_slots(slot_time, booking_status)')
        .not('shootdate', 'is', null)
        .gte('shootdate', today.toISOString().split('T')[0])
        .lte('shootdate', nextMonth.toISOString().split('T')[0])
        .order('shootdate', { ascending: true })
        .limit(5);

      setUpcomingShoots(shootsData || []);

      // 5. Recent Activity Logs
      const { data: logsData } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      setRecentLogs(logsData || []);

      // Collect User IDs for Cache
      const userIds = new Set();
      projects.forEach(p => p.user_id && userIds.add(p.user_id));
      logsData?.forEach(l => l.actor_id && l.actor_id !== 'system' && userIds.add(l.actor_id));
      
      if (userIds.size > 0) {
        await getUserNames([...userIds]);
      }

      setStats({
        totalProjects,
        activeProjects,
        scriptPending: scriptPendingCount || 0,
        schedulePending: schedulePendingCount || 0,
        upcomingShootsCount: shootsData?.length || 0
      });

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      toast.error('대시보드 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, getUserNames]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">대시보드 로딩 중...</div>;
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      {/* 1. Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-muted-foreground">프로젝트 현황과 주요 일정을 한눈에 확인하세요.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button asChild variant="outline">
             <Link to="/admin/createusers"><Users className="mr-2 h-4 w-4"/> 센터 추가</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/createproject"><FileText className="mr-2 h-4 w-4"/> 프로젝트 생성</Link>
          </Button>
        </div>
      </div>

      {/* 2. KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="진행 중인 프로젝트" 
          value={stats.activeProjects} 
          description={`전체 ${stats.totalProjects}개 프로젝트 중`}
          icon={Activity} 
          colorClass="text-blue-500"
        />
        <StatCard 
          title="대본 검토 대기" 
          value={stats.scriptPending} 
          description="처리가 필요한 대본입니다."
          icon={FileText} 
          colorClass="text-yellow-500"
        />
        <StatCard 
          title="일정 승인 대기" 
          value={stats.schedulePending} 
          description="예약 요청이 들어온 건수입니다."
          icon={Clock} 
          colorClass="text-orange-500"
        />
        <StatCard 
          title="이번 달 촬영 예정" 
          value={stats.upcomingShootsCount} 
          description="30일 이내 확정된 촬영입니다."
          icon={Video} 
          colorClass="text-green-500"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* 3. Project Status Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>프로젝트 단계별 현황</CardTitle>
            <CardDescription>
                현재 진행 중인 프로젝트들의 상태 분포입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={projectStatusData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                    itemStyle={{ color: '#f8fafc' }}
                    cursor={{fill: '#334155', opacity: 0.4}}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                    {projectStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Upcoming Shoots & Recent Activity */}
        <Card className="col-span-3 flex flex-col h-full">
          <CardHeader>
            <CardTitle>주요 일정 및 활동</CardTitle>
            <CardDescription>
              다가오는 촬영 일정과 최근 활동 로그입니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-6">
            
            {/* Upcoming Shoots List */}
            <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center text-slate-200">
                    <Calendar className="mr-2 h-4 w-4 text-green-500"/> 다가오는 촬영
                </h4>
                <div className="space-y-3">
                    {upcomingShoots.length > 0 ? (
                        upcomingShoots.map(project => {
                            // Find confirmed slot time for precision
                            const confirmedSlot = project.time_slots?.find(ts => ts.booking_status === 'confirmed');
                            const timeStr = confirmedSlot ? new Date(confirmedSlot.slot_time).toLocaleTimeString('ko-KR', {hour: '2-digit', minute:'2-digit'}) : '';
                            
                            return (
                                <div key={project.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-md border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center bg-slate-800 p-2 rounded text-xs min-w-[50px]">
                                            <span className="font-bold text-slate-300">{new Date(project.shootdate).getMonth()+1}월</span>
                                            <span className="font-bold text-lg text-white">{new Date(project.shootdate).getDate()}일</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-200">{userCache[project.user_id]?.username || '센터명 로딩중'}</p>
                                            <p className="text-xs text-slate-500">{project.name} {timeStr && `(${timeStr})`}</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">D-{Math.ceil((new Date(project.shootdate) - new Date()) / (1000 * 60 * 60 * 24))}</Badge>
                                </div>
                            )
                        })
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">예정된 촬영이 없습니다.</p>
                    )}
                </div>
            </div>

            <Separator className="bg-slate-800" />

            {/* Recent Logs */}
            <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center text-slate-200">
                    <Activity className="mr-2 h-4 w-4 text-blue-500"/> 최근 활동
                </h4>
                <div className="space-y-4 pl-2 border-l-2 border-slate-800">
                    {recentLogs.length > 0 ? (
                        recentLogs.map(log => (
                            <div key={log.id} className="relative pl-4 pb-1">
                                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-slate-600 ring-4 ring-slate-950" />
                                <p className="text-sm text-slate-300">
                                    <span className="font-semibold text-blue-400">{userCache[log.actor_id]?.username || log.actor_id === 'system' ? 'System' : 'Admin'}</span>
                                    님이 <span className="font-mono text-xs text-slate-500">{log.target_table}</span> {log.action_type} 수행
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {new Date(log.created_at).toLocaleString('ko-KR')}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">최근 활동이 없습니다.</p>
                    )}
                </div>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminOverview;
