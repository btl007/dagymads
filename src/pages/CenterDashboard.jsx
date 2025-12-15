import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CheckCircle2, 
  FileText, 
  Video, 
  Calendar, 
  ArrowRight,
  BookOpen,
  Edit3,
  UserCog,
  AlertTriangle,
  Phone,
  Info,
  Clock
} from 'lucide-react';
import { STATUS_MAP } from '@/data/projectStatuses';
import UserScheduleModal from '@/components/UserScheduleModal';

// Progress Steps Definition
const STEPS = [
  { id: 'contract', label: '계약 완료', icon: CheckCircle2 },
  { id: 'script', label: '대본 작성', icon: FileText },
  { id: 'scheduling', label: '일정 조율', icon: Clock },
  { id: 'schedule_fixed', label: '촬영 준비', icon: Calendar },
  { id: 'filming', label: '영상 촬영', icon: Video },
  { id: 'editing', label: '편집 중', icon: Video },
  { id: 'complete', label: '최종 완료', icon: CheckCircle2 },
];

// Helper to determine active step based on project status
const getActiveStepIndex = (status) => {
  if (!status) return 0;
  switch (status) {
    case 'script_needed':
      return 1;
    case 'script_submitted':
    case 'under_review':
    case 'schedule_needed':
    case 'schedule_requested':
      return 2;
    case 'schedule_confirmed':
    case 'schedule_fixed':
      return 3;
    case 'shooting':
    case 'shoot_completed':
      return 4;
    case 'editing':
    case 'feedback':
    case 're_editing':
      return 5;
    case 'final_review':
    case 'project_complete':
      return 6;
    default:
      return 0;
  }
};

const CenterDashboard = () => {
  const { user } = useUser();
  const supabase = useSupabase();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [confirmedSlot, setConfirmedSlot] = useState(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('member_name, sales_manager')
          .eq('user_id', user.id)
          .single();
        
        setUserProfile(profile);

        const { data: projects } = await supabase
          .from('projects')
          .select(`
            *,
            scripts (id, status, created_at),
            time_slots (id, slot_time, booking_status)
          `)
          .eq('user_id', user.id)
          .not('status', 'in', '("project_complete","project_cancled")')
          .order('created_at', { ascending: false })
          .limit(1);

        if (projects && projects.length > 0) {
          const activeProject = projects[0];
          
          // Sort scripts to get the latest one safely
          if (activeProject.scripts && activeProject.scripts.length > 0) {
             activeProject.scripts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          }

          setProject(activeProject);
          const confirmed = activeProject.time_slots?.find(ts => ts.booking_status === 'confirmed');
          setConfirmedSlot(confirmed);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (!supabase || !user) return;
    fetchData();
  }, [supabase, user]);

  const handleScheduleSuccess = () => {
      fetchData(); // Refresh data to show updated status
      setIsScheduleModalOpen(false);
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-5xl mx-auto py-10 px-4 space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 bg-slate-800" />
            <Skeleton className="h-4 w-64 bg-slate-800" />
          </div>
          <Skeleton className="h-6 w-32 bg-slate-800" />
        </div>

        {/* Hero Card Skeleton */}
        <Skeleton className="w-full h-[300px] rounded-xl bg-slate-800" />

        {/* Steps Skeleton */}
        <div className="w-full h-12 bg-slate-900/50 rounded-lg border border-slate-800" />

        {/* Quick Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-xl bg-slate-800" />
          <Skeleton className="h-40 rounded-xl bg-slate-800" />
          <Skeleton className="h-40 rounded-xl bg-slate-800" />
        </div>
      </div>
    );
  }

  // --- Logic for Hero Section (State Matrix) ---
  
  // 1. Determine Script Status
  let scriptStatus = 'Unwritten';
  if (project?.scripts && project.scripts.length > 0) {
    const s = project.scripts[0]; // Latest script
    if (s.status === 'draft') scriptStatus = 'Draft';
    else scriptStatus = 'Submitted';
  }

  // 2. Determine Schedule Status
  let scheduleStatus = 'Null';
  if (project) {
      if (project.status === 'schedule_confirmed' || project.status === 'schedule_fixed' || confirmedSlot) {
          scheduleStatus = 'Confirmed';
      } else if (project.status === 'schedule_requested' || project.status === 'schedule_needed') {
          const hasRequested = project.time_slots?.some(ts => ts.booking_status === 'requested');
          if (hasRequested || project.status === 'schedule_requested') scheduleStatus = 'Requested';
          else scheduleStatus = 'Null';
      }
  }

  // 3. Evaluate Matrix
  const activeStepIndex = project ? getActiveStepIndex(project.status) : 0;
  const statusLabel = project ? (STATUS_MAP.get(project.status) || project.status) : '준비 중';

  let heroTitle = "안녕하세요! 다짐 광고 센터입니다.";
  let heroDesc = "현재 진행 중인 프로젝트가 없습니다. 담당자에게 문의해주세요.";
  let heroAction = null;
  let heroBgClass = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"; // Default

  if (project) {
      // Production Phase overrides everything
      if (activeStepIndex >= 4) {
          // ... (Same production phase logic)
          if (activeStepIndex === 4) { 
            heroTitle = "영상 촬영이 진행 중입니다 🎥";
            heroDesc = "최고의 퀄리티를 위해 촬영팀이 열심히 작업하고 있습니다.";
          } else if (activeStepIndex === 5) { 
            heroTitle = "예쁘게 편집 중입니다 ✂️";
            heroDesc = "촬영된 영상을 더욱 멋지게 다듬고 있습니다. 곧 만나보실 수 있습니다!";
          } else if (activeStepIndex === 6) { 
            heroTitle = "영상이 완성되었습니다! 🎉";
            heroDesc = "완성된 영상은 다짐 앱에서 확인하실 수 있습니다.";
            heroBgClass = "bg-gradient-to-br from-purple-950 via-slate-900 to-slate-900";
          }
      } 
      // Canceled / Paused
      else if (project.status === 'project_cancled' || project.status === 'project_paused') {
          // ... (Same canceled logic)
          heroTitle = "프로젝트가 보류/취소되었습니다.";
          heroDesc = "스탠다드 플랜 진행에 도움이 필요하신가요?";
          heroAction = (
            <Button size="lg" variant="destructive" className="mt-4 gap-2" asChild>
                <a href="tel:1811-4751">
                    <Phone className="w-5 h-5"/> 영업팀 문의하기
                </a>
            </Button>
          );
          heroBgClass = "bg-gradient-to-br from-red-950 via-slate-900 to-slate-950";
      }
      // Pre-Production Matrix Logic
      else {
          // Adaptive D-Day Logic
          let dueDate;
          if (confirmedSlot) {
              // Shoot Date - 2 Days
              const shootDate = new Date(confirmedSlot.slot_time);
              dueDate = new Date(shootDate.setDate(shootDate.getDate() - 2));
          } else {
              // Created + 14 Days
              const createdDate = new Date(project.created_at);
              dueDate = new Date(createdDate.setDate(createdDate.getDate() + 14));
          }
          
          const today = new Date();
          const diffTime = dueDate - today;
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          const isUrgent = diffDays <= 3;
          
          const dDayBadge = (
              <span className={`font-semibold ${isUrgent ? 'text-red-400' : 'text-blue-300'}`}>
                   📅 대본 마감: {dueDate.toLocaleDateString('ko-KR')} ({diffDays > 0 ? `D-${diffDays}` : diffDays === 0 ? 'D-Day' : `D+${Math.abs(diffDays)}`})
              </span>
          );
          
          const shootInfo = confirmedSlot ? (
              <div className="mt-2 p-2 bg-black/20 rounded text-sm text-slate-200 inline-block border border-slate-600">
                  🎬 촬영 확정일: <strong>{new Date(confirmedSlot.slot_time).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })} {new Date(confirmedSlot.slot_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</strong>
              </div>
          ) : null;

          if (scheduleStatus === 'Confirmed') {
              if (scriptStatus === 'Unwritten') {
                  // Case 1: Critical (Confirmed + Unwritten)
                  heroTitle = "촬영일 확정! 하지만 대본이 없습니다! 🚨";
                  heroDesc = (
                    <div className="space-y-2">
                        <p>확정된 촬영일 <strong>2일 전까지</strong> 대본을 반드시 제출해주세요.</p>
                        {shootInfo}
                        <div>{dDayBadge}</div>
                    </div>
                  );
                  heroAction = (
                    <Button size="lg" variant="destructive" className="mt-4 text-lg px-8 animate-pulse" asChild>
                        <Link to="/editor">
                            <Edit3 className="ml-2 w-5 h-5" /> 대본 작성 시작하기 (긴급)
                        </Link>
                    </Button>
                  );
                  heroBgClass = "bg-gradient-to-br from-red-950 via-slate-900 to-slate-900";
              } else if (scriptStatus === 'Draft') {
                  // Case 2: Warning (Confirmed + Draft)
                  heroTitle = "촬영일 확정! 대본을 마무리해주세요 ✍️";
                  heroDesc = (
                    <div className="space-y-2">
                        <p>작성 중인 대본이 있습니다. 촬영 <strong>2일 전까지</strong> 제출을 부탁드립니다.</p>
                        {shootInfo}
                        <div>{dDayBadge}</div>
                    </div>
                  );
                  heroAction = (
                    <Button size="lg" className="mt-4 text-lg px-8 bg-orange-600 hover:bg-orange-700 text-white" asChild>
                        <Link to="/editor">
                            <Edit3 className="ml-2 w-5 h-5" /> 대본 이어쓰기
                        </Link>
                    </Button>
                  );
                  heroBgClass = "bg-gradient-to-br from-orange-950 via-slate-900 to-slate-900";
              } else { // Submitted
                  // Case 3: Good (Confirmed + Submitted)
                  heroTitle = "촬영 준비 완료! 🎬";
                  heroDesc = confirmedSlot 
                    ? `${new Date(confirmedSlot.slot_time).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' })} ${new Date(confirmedSlot.slot_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}에 방문할 예정입니다.`
                    : "곧 촬영팀이 방문할 예정입니다. 준비사항을 확인해주세요.";
                  heroAction = (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button size="lg" variant="outline" className="border-green-700 text-green-400 hover:bg-green-950 hover:text-green-300" asChild>
                            <Link to="/dagymguide">
                                <CheckCircle2 className="mr-2 w-5 h-5" /> 준비사항 확인하기
                            </Link>
                        </Button>
                        <Button size="lg" variant="ghost" className="text-slate-400 hover:text-white" asChild>
                            <Link to="/editor">
                                <Edit3 className="mr-2 w-5 h-5" /> 대본 수정하기
                            </Link>
                        </Button>
                    </div>
                  );
                  heroBgClass = "bg-gradient-to-br from-green-950 via-slate-900 to-slate-900";
              }
          } 
          else if (scheduleStatus === 'Requested') {
             // ... (Keep Requested logic, just add dDayBadge)
             if (scriptStatus === 'Unwritten') {
                 heroTitle = "일정 조율 중입니다. 대본을 작성해주세요 📝";
                 heroDesc = (<span>촬영 일정 요청이 접수되었습니다. 기다리시는 동안 대본을 작성해주세요.<br/>{dDayBadge}</span>);
                 heroAction = (
                    <Button size="lg" className="mt-4 text-lg px-8" asChild>
                        <Link to="/editor">
                            <Edit3 className="ml-2 w-5 h-5" /> 대본 작성하기
                        </Link>
                    </Button>
                 );
             } else if (scriptStatus === 'Draft') {
                 heroTitle = "일정 조율 중입니다. 대본을 완성해주세요 ⏳";
                 heroDesc = (<span>틈틈이 대본을 작성하여 촬영을 미리 준비해보세요.<br/>{dDayBadge}</span>);
                 heroAction = (
                    <Button size="lg" className="mt-4 text-lg px-8" asChild>
                        <Link to="/editor">
                            <Edit3 className="ml-2 w-5 h-5" /> 대본 이어쓰기
                        </Link>
                    </Button>
                 );
             } else { 
                 heroTitle = "대본과 일정 요청이 접수되었습니다 ✅";
                 heroDesc = "영상 촬영팀이 24시간(영업일 기준) 이내에 확인 후 연락드립니다.";
                 heroAction = (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button size="lg" variant="outline" className="text-lg px-8 border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                            <Link to="/editor">
                                <Edit3 className="mr-2 w-5 h-5" /> 대본 수정하기
                            </Link>
                        </Button>
                    </div>
                 );
             }
             heroBgClass = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
          }
          else { // Null
              // ... (Keep Null logic, add dDayBadge)
              if (scriptStatus === 'Unwritten') {
                  heroTitle = "프로젝트 시작! 무엇부터 하시겠어요? 🚀";
                  heroDesc = (<span>대본 작성과 촬영 일정 예약을 병렬로 진행할 수 있습니다.<br/>{dDayBadge}</span>);
                  heroAction = (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700 text-white" asChild>
                            <Link to="/editor">
                                <Edit3 className="ml-2 w-5 h-5" /> 대본 작성하기
                            </Link>
                        </Button>
                        <Button size="lg" onClick={() => setIsScheduleModalOpen(true)} className="text-lg px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                            <Calendar className="mr-2 w-5 h-5" /> 촬영 일정 예약하기
                        </Button>                    </div>
                  );
                  heroBgClass = "bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900";
              } else if (scriptStatus === 'Draft') {
                  heroTitle = "작성 중인 대본이 있습니다 📝";
                  heroDesc = (<span>대본을 마무리하거나, 촬영 일정을 먼저 잡으셔도 됩니다.<br/>{dDayBadge}</span>);
                   heroAction = (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button size="lg" className="text-lg px-8" asChild>
                            <Link to="/editor">
                                <Edit3 className="ml-2 w-5 h-5" /> 대본 이어쓰기
                            </Link>
                        </Button>
                        <Button size="lg" onClick={() => setIsScheduleModalOpen(true)} className="text-lg px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                            <Calendar className="mr-2 w-5 h-5" /> 촬영 일정 예약하기
                        </Button>                    </div>
                  );
                  heroBgClass = "bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900";
              } else { 
                  heroTitle = "대본이 접수되었습니다! 일정을 잡아주세요 📅";
                  heroDesc = "대본은 준비되었습니다. 이제 촬영 희망 일정을 예약해주세요.";
                  heroAction = (
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button size="lg" onClick={() => setIsScheduleModalOpen(true)} className="text-lg px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/20">
                            <Calendar className="mr-2 w-5 h-5" /> 촬영 일정 예약하기
                        </Button>
                         <Button size="lg" variant="outline" className="text-lg px-8 border-slate-500 text-slate-300 hover:bg-slate-800 hover:text-white" asChild>
                            <Link to="/editor">
                                <Edit3 className="mr-2 w-5 h-5" /> 대본 수정하기
                            </Link>
                        </Button>
                    </div>
                  );
                  heroBgClass = "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900";
              }
          }
      }
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 space-y-12">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground mt-1">
            {userProfile?.member_name ? `${userProfile.member_name}님, 환영합니다!` : '환영합니다!'} 
            {project ? ` 현재 '${project.name}' 프로젝트가 진행 중입니다.` : ' 진행 중인 프로젝트를 확인하세요.'}
            </p>
        </div>
        {userProfile?.sales_manager && (
            <Badge variant="outline" className="px-3 py-1 text-sm bg-slate-900/50">
                담당 매니저: {userProfile.sales_manager}
            </Badge>
        )}
      </div>

      {/* 2. Hero Card (Main Status) */}
      <Card className={`${heroBgClass} border-slate-700 shadow-2xl overflow-hidden relative min-h-[300px] flex flex-col justify-center`}>
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 p-40 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none mix-blend-overlay" />
        <div className="absolute bottom-0 left-0 p-32 bg-black/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        
        <CardContent className="p-8 md:p-12 relative z-10 flex flex-col items-start justify-center h-full space-y-6">
            <div className="space-y-4">
                {project && (
                    <Badge className="bg-white/10 text-white hover:bg-white/20 border-none backdrop-blur-sm px-3 py-1.5 text-sm">
                        Step {activeStepIndex + 1}. {STATUS_MAP.get(project.status) || project.status}
                    </Badge>
                )}
                <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight drop-shadow-sm">
                    {heroTitle}
                </h2>
                <div className="text-lg md:text-xl text-slate-300 max-w-2xl leading-relaxed">
                    {heroDesc}
                </div>
            </div>
            {heroAction}
        </CardContent>
      </Card>

      {/* 3. Progress Steps (Visual Tracker) */}
      <div className="relative py-4">
        {/* Desktop View */}
        <div className="hidden md:flex justify-between items-center w-full px-4 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-800 -z-10 -translate-y-1/2 rounded-full" />
            <div 
                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${(activeStepIndex / (STEPS.length - 1)) * 100}%` }}
            />

            {STEPS.map((step, index) => {
                const isActive = index === activeStepIndex;
                const isCompleted = index < activeStepIndex;
                const Icon = step.icon;

                return (
                    <div key={step.id} className="flex flex-col items-center relative group">
                        <div 
                            className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10
                                ${isActive ? 'border-primary bg-background text-primary scale-125 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                                  isCompleted ? 'border-primary bg-primary text-primary-foreground' : 
                                  'border-slate-800 bg-slate-900 text-slate-600'}
                            `}
                        >
                            <Icon className="w-4 h-4" />
                        </div>
                        <p className={`absolute -bottom-8 text-xs font-semibold whitespace-nowrap transition-colors duration-300
                            ${isActive ? 'text-primary' : isCompleted ? 'text-slate-400' : 'text-slate-700'}
                        `}>
                            {step.label}
                        </p>
                    </div>
                );
            })}
        </div>

        {/* Mobile View (Simple Text) */}
        <div className="md:hidden flex items-center justify-between bg-slate-900 p-4 rounded-lg border border-slate-800">
             <span className="text-sm text-slate-400">현재 단계</span>
             <div className="flex items-center text-primary font-bold">
                {(() => {
                    const CurrentIcon = STEPS[activeStepIndex]?.icon;
                    return CurrentIcon && <CurrentIcon className="w-4 h-4 mr-2"/>;
                })()}
                {STEPS[activeStepIndex]?.label || '진행 중'}
             </div>
        </div>
      </div>

      {/* 4. Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        
        <Link to="/dagymguide" className="block group">
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-blue-500/50 hover:bg-slate-900 transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:shadow-blue-900/20">
                <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center text-xl group-hover:text-blue-400 transition-colors">
                        <BookOpen className="w-5 h-5 mr-2 text-slate-500 group-hover:text-blue-400" />
                        촬영 가이드
                    </CardTitle>
                    <CardDescription>촬영 전 필독! 꿀팁 확인하기</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end">
                        <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-blue-400 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>

        <Link to="/editor" className="block group">
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-yellow-500/50 hover:bg-slate-900 transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:shadow-yellow-900/20">
                <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center text-xl group-hover:text-yellow-400 transition-colors">
                        <Edit3 className="w-5 h-5 mr-2 text-slate-500 group-hover:text-yellow-400" />
                        대본 작성
                    </CardTitle>
                    <CardDescription>우리 센터만의 스토리 담기</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end">
                        <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-yellow-400 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>

        <Link to="/profile" className="block group">
            <Card className="h-full bg-slate-900/50 border-slate-800 hover:border-green-500/50 hover:bg-slate-900 transition-all duration-300 cursor-pointer group-hover:shadow-lg group-hover:shadow-green-900/20">
                <CardHeader className="space-y-1">
                    <CardTitle className="flex items-center text-xl group-hover:text-green-400 transition-colors">
                        <UserCog className="w-5 h-5 mr-2 text-slate-500 group-hover:text-green-400" />
                        내 정보 수정
                    </CardTitle>
                    <CardDescription>센터 담당자 및 연락처 변경</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end">
                        <ArrowRight className="w-5 h-5 text-slate-700 group-hover:text-green-400 -translate-x-2 group-hover:translate-x-0 transition-transform" />
                    </div>
                </CardContent>
            </Card>
        </Link>

      </div>

      {/* 5. Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-800" id="contact-info">
        
        {/* Sales Manager Info */}
        <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Info className="w-5 h-5 mr-2 text-blue-500" />
                    담당 매니저 정보
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-400">
                        {userProfile?.sales_manager ? userProfile.sales_manager[0] : '?'}
                    </div>
                    <div>
                        <p className="font-semibold text-lg">
                            {userProfile?.sales_manager || '배정 중'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                            {userProfile?.sales_manager ? '전담 영업 매니저' : '담당자가 곧 배정될 예정입니다.'}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* CS Info */}
        <Card className="bg-slate-900/30 border-slate-800">
            <CardHeader>
                <CardTitle className="flex items-center text-lg">
                    <Phone className="w-5 h-5 mr-2 text-green-500" />
                    고객센터 안내
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <Alert className="bg-slate-950 border-slate-800">
                    <AlertTitle className="font-semibold text-slate-200">다짐 매니저 앱 문의</AlertTitle>
                    <AlertDescription className="text-slate-400 text-sm">
                        계약, 결제 등 일반 민원은 <strong>다짐 매니저 앱</strong> 또는 아래 번호로 문의해주세요.
                    </AlertDescription>
                </Alert>
                <div className="flex justify-between items-center p-3 bg-slate-950/50 rounded-md">
                    <span className="text-sm font-medium text-slate-400">고객센터 대표번호</span>
                    <a href="tel:1811-4751" className="text-lg font-bold hover:underline">1811-4751</a>
                </div>
            </CardContent>
        </Card>

      </div>

      {project && (
        <UserScheduleModal
            isOpen={isScheduleModalOpen}
            onClose={() => setIsScheduleModalOpen(false)}
            projectId={project.id}
            onSuccess={handleScheduleSuccess}
        />
      )}

    </div>
  );
};

export default CenterDashboard;