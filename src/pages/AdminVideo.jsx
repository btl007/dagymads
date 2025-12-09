import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { CustomCalendar } from '../components/CustomCalendar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ko } from 'date-fns/locale';
import AdminSchedulePickerModal from '../components/AdminSchedulePickerModal';

const AdminVideo = () => {
  const supabase = useSupabase();
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [editingProject, setEditingProject] = useState(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const [pendingRequests, setPendingRequests] = useState([]);
  const [isRequestsLoading, setIsRequestsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClerkUserDetails = async (userIds) => {
    if (userIds.length === 0) return {};
    const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userIds }),
    });
    if (!response.ok) throw new Error('Failed to fetch user details from Clerk');
    return response.json();
  };

  const fetchPendingRequests = useCallback(async () => {
    if (!supabase) return;
    setIsRequestsLoading(true);
    try {
      const { data: requestsData, error: requestsError } = await supabase.rpc('get_pending_requests');
      if (requestsError) throw requestsError;

      const userIds = [...new Set(requestsData.map(r => r.user_id))];
      const usersData = await fetchClerkUserDetails(userIds);

      const combinedData = requestsData.map(req => ({
        ...req,
        center_name: usersData[req.user_id]?.username || 'N/A',
      }));

      setPendingRequests(combinedData);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      toast.error("승인 대기 목록을 불러오는데 실패했습니다.", { description: err.message });
    } finally {
      setIsRequestsLoading(false);
    }
  }, [supabase]);

  const fetchConfirmedProjects = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    try {
      // Fetch projects with their confirmed time slots to get precise time
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*, time_slots(slot_time, booking_status)')
        .not('shootdate', 'is', null)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const userIds = [...new Set(projectsData.map(p => p.user_id))];
      const usersData = await fetchClerkUserDetails(userIds);

      const combinedData = projectsData.map(project => {
        // Find the confirmed slot for this project
        const confirmedSlot = project.time_slots?.find(ts => ts.booking_status === 'confirmed');
        const slotTime = confirmedSlot ? confirmedSlot.slot_time : null;

        return {
          ...project,
          center_name: usersData[project.user_id]?.username || 'N/A',
          slot_time: slotTime
        };
      });

      setProjects(combinedData);
    } catch (err) {
      console.error('Error fetching project data in AdminVideo:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPendingRequests();
    fetchConfirmedProjects();
  }, [fetchPendingRequests, fetchConfirmedProjects]);

  const handleApprove = async (projectId, slotId) => {
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('confirm_schedule_slot', {
        p_project_id: projectId,
        p_confirmed_slot_id: slotId,
      });
      if (error) throw error;
      toast.success("예약을 승인했습니다.");
      await Promise.all([fetchPendingRequests(), fetchConfirmedProjects()]);
    } catch (err) {
      toast.error("예약 승인에 실패했습니다.", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async (projectId, slotId) => {
    if (!supabase) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.rpc('deny_schedule_slot', {
        p_project_id: projectId,
        p_slot_id: slotId,
      });
      if (error) throw error;
      toast.success("예약을 거절했습니다.");
      await Promise.all([fetchPendingRequests(), fetchConfirmedProjects()]);
    } catch (err) {
      toast.error("예약 거절에 실패했습니다.", { description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const projectsInSelectedMonth = useMemo(() => {
    if (!selectedDate) return [];
    const startOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const endOfMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);

    return projects.filter(p => {
      if (!p.shootdate) return false;
      const shootDate = new Date(p.shootdate + 'T00:00:00');
      return shootDate >= startOfMonth && shootDate <= endOfMonth;
    });
  }, [projects, selectedDate]);

  const highlightedDates = projects.map(p => p.shootdate).filter(Boolean).map(dateStr => new Date(dateStr + 'T00:00:00'));

  const handleClosePicker = () => {
    setIsPickerOpen(false);
    setEditingProject(null);
    fetchConfirmedProjects(); // Refresh list to reflect changes
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '시간 미정';
    const date = new Date(dateString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    
    // Check if time part exists (if it's just a date string YYYY-MM-DD, hours might be 00 or 09 depending on timezone parsing)
    // But since we use slot_time (ISO string), it should have time.
    // Fallback logic for simple date string if slot_time is missing
    if (dateString.length === 10) return `${yyyy}-${mm}-${dd}`;

    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  return (
    <div className="p-4 md:p-8 flex flex-col gap-6">
        {/* Pending Requests Section */}
        <Card className="bg-gray-800 border-gray-700 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">승인 대기 중인 예약 요청 <Badge className="ml-2">{pendingRequests.length}</Badge></CardTitle>
          </CardHeader>
          <CardContent>
            {isRequestsLoading ? (
              <div className="text-center text-gray-400">요청 목록을 불러오는 중...</div>
            ) : pendingRequests.length > 0 ? (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {pendingRequests.map(req => (
                  <div key={req.slot_id} className="flex items-center justify-between p-3 bg-gray-900/70 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-200">{req.center_name}</p>
                      <p className="text-sm text-slate-400">{req.project_name}</p>
                      <p className="text-sm font-mono text-cyan-400">{new Date(req.slot_time).toLocaleString('ko-KR')}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-400" onClick={() => handleDeny(req.project_id, req.slot_id)} disabled={isSubmitting}>
                        <XCircle className="mr-2 h-4 w-4"/> 거절
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-500" onClick={() => handleApprove(req.project_id, req.slot_id)} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />} 승인
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-400">새로운 예약 요청이 없습니다.</div>
            )}
          </CardContent>
        </Card>

        {/* Main Content: Calendar and Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Left Panel: Calendar */}
          <div className="md:col-span-2">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>촬영일 캘린더 (확정)</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <CustomCalendar
                  mode="single"
                  locale={ko}
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  highlightedDates={highlightedDates}
                  className="w-full rounded-md border-0 bg-transparent"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Project Details */}
          <div className="md:col-span-1">
            <Card className="bg-gray-800 border-gray-700 text-white">
              <CardHeader>
                <CardTitle>
                  {selectedDate ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월 촬영 정보` : '날짜를 선택하세요'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center text-gray-400 mt-10">로딩 중...</div>
                ) : error ? (
                  <div className="text-center text-red-400 mt-10">에러: {error}</div>
                ) : selectedDate && projectsInSelectedMonth.length > 0 ? (
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {projectsInSelectedMonth.map(project => (
                      <div 
                        key={project.id} 
                        onClick={() => {
                          setEditingProject(project);
                          setIsPickerOpen(true);
                        }}
                      >
                        <Card className="bg-gray-900/70 border-gray-700 p-4 cursor-pointer hover:bg-gray-800 transition-colors">
                          <div className="flex flex-col gap-3 w-full">
                              <div className="flex justify-between items-center">
                                  <Badge variant="secondary" className="text-base px-3 py-1 font-mono tracking-tight bg-slate-700 text-slate-100 hover:bg-slate-600">
                                     {formatDateTime(project.slot_time || project.shootdate)}
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-white">변경</Button>
                              </div>
                              <div>
                                  <p className="text-xl font-bold text-slate-100 truncate">{project.center_name}</p>
                                  <p className="text-sm text-slate-400 truncate">{project.name}</p>
                              </div>
                          </div>
                        </Card>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-400 mt-10">
                    {selectedDate ? `${selectedDate.getFullYear()}년 ${selectedDate.getMonth() + 1}월에 예정된 촬영이 없습니다.` : '캘린더에서 날짜를 선택하여 촬영 정보를 확인하세요.'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

      {/* Admin Schedule Picker Modal */}
      {editingProject && (
        <AdminSchedulePickerModal
          project={editingProject}
          isOpen={isPickerOpen}
          onClose={handleClosePicker}
        />
      )}
    </div>
  );
};

export default AdminVideo;
