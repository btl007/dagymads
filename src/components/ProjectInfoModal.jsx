import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { CustomCalendar } from './CustomCalendar';
import { PROJECT_STATUSES } from '../data/projectStatuses';

const ProjectInfoModal = ({ project, userName }) => {
  const supabase = useSupabase();

  // State for editable fields, initialized from props
  const [address, setAddress] = useState('');
  const [memberName, setMemberName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('');
  const [shootDate, setShootDate] = useState(null);
  const [frameIoLink, setFrameIoLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [contactHistory, setContactHistory] = useState('');
  const [userInfo, setUserInfo] = useState('');
  const [cameraCrew, setCameraCrew] = useState('');
  const [scheduleRequests, setScheduleRequests] = useState([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ]);

  useEffect(() => {
    if (project) {
      setAddress(project.user_profiles?.address || '');
      setMemberName(project.user_profiles?.member_name || '');
      setPhoneNumber(project.user_profiles?.phone_number || '');
      setStatus(project.status || '');
      setShootDate(project.shootdate ? new Date(project.shootdate) : null);
      setFrameIoLink(project.frame_io_link || '');
      setYoutubeLink(project.youtube_link || '');
      setContactHistory(project.contact_history || '');
      setUserInfo(project.user_profiles?.info || '');
      setCameraCrew(project.camera_crew || '');

      const existingRequests = project.require_schedule || [];
      const paddedRequests = [...existingRequests, ...Array(3 - existingRequests.length).fill({ date: '', time: '' })].slice(0, 3);
      setScheduleRequests(paddedRequests);
    }
  }, [project]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleSave = async () => {
    if (!supabase || !project) return;

    const nonEmptyRequests = scheduleRequests.filter(r => r.date && r.time);

    const { error: projectUpdateError } = await supabase.from('projects').update({
      status,
      shootdate: shootDate ? formatDate(shootDate) : null,
      frame_io_link: frameIoLink,
      youtube_link: youtubeLink,
      contact_history: contactHistory,
      camera_crew: cameraCrew,
      require_schedule: nonEmptyRequests,
    }).eq('id', project.id);

    const { error: profileUpdateError } = await supabase.from('user_profiles').update({ 
      info: userInfo,
      address: address,
      member_name: memberName,
      phone_number: phoneNumber,
    }).eq('user_id', project.user_id);

    if (projectUpdateError || profileUpdateError) {
      alert('저장 실패: ' + (projectUpdateError?.message || profileUpdateError?.message));
    } else {
      alert('성공적으로 저장되었습니다.');
      // onClose(); // Removed as it's handled by parent
    }
  };

  const handleScheduleRequestChange = (index, field, value) => {
    const newRequests = [...scheduleRequests];
    newRequests[index][field] = value;
    setScheduleRequests(newRequests);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{project?.name || '프로젝트 정보'}</DialogTitle>
        <DialogDescription>프로젝트의 모든 정보를 확인하고 수정합니다.</DialogDescription>
      </DialogHeader>

      {project ? (
        <div className="flex-grow overflow-y-auto pr-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div className="space-y-2"><Label>센터명</Label><p className="text-sm font-semibold pt-2">{userName || 'N/A'}</p></div>
            <div className="space-y-2"><Label htmlFor="address">센터 주소</Label><Input id="address" value={address} onChange={e => setAddress(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="memberName">담당자명</Label><Input id="memberName" value={memberName} onChange={e => setMemberName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="phoneNumber">담당자 연락처</Label><Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="status">현재 상태</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="status"><SelectValue placeholder="상태 선택..." /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>프로젝트 개설일</Label><p className="text-sm font-semibold pt-2">{formatDate(project.created_at)}</p></div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">상세 정보</TabsTrigger>
              <TabsTrigger value="schedule">일정 조율</TabsTrigger>
              <TabsTrigger value="video">촬영/영상 관리</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <Label htmlFor="userInfo">특이사항</Label>
              <textarea id="userInfo" className="w-full h-48 p-2 bg-slate-800 border border-slate-700 rounded-md text-sm" value={userInfo} onChange={e => setUserInfo(e.target.value)} placeholder="센터 관련 특이사항을 입력하세요..." />
            </TabsContent>

            <TabsContent value="schedule" className="space-y-4 py-4">
              <Label>사용자 희망 촬영일 (최대 3개)</Label>
              {scheduleRequests.map((req, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input type="date" value={formatDate(req.date)} onChange={e => handleScheduleRequestChange(index, 'date', e.target.value)} />
                  <Input type="text" value={req.time} onChange={e => handleScheduleRequestChange(index, 'time', e.target.value)} placeholder="예: 14:00~16:00" />
                </div>
              ))}
            </TabsContent>

            <TabsContent value="video" className="space-y-4 py-4">
              <div className="space-y-2"><Label>촬영일 확정</Label><div><Popover><PopoverTrigger asChild><Button variant={"outline"}>{shootDate ? formatDate(shootDate) : "촬영일 선택"}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><CustomCalendar mode="single" selected={shootDate} onSelect={setShootDate} /></PopoverContent></Popover></div></div>
              <div className="space-y-2"><Label htmlFor="cameraCrew">촬영팀</Label><Input id="cameraCrew" value={cameraCrew} onChange={e => setCameraCrew(e.target.value)} placeholder="참여한 촬영팀 입력..." /></div>
              <div className="space-y-2"><Label htmlFor="frameio">Frame.io 링크</Label><Input id="frameio" value={frameIoLink} onChange={e => setFrameIoLink(e.target.value)} placeholder="https://frame.io/..." /></div>
              <div className="space-y-2"><Label htmlFor="youtube">최종 YouTube 링크</Label><Input id="youtube" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
              <div className="space-y-2"><Label htmlFor="contactHistory">컨택 히스토리</Label><textarea id="contactHistory" className="w-full h-48 p-2 bg-slate-800 border border-slate-700 rounded-md text-sm" value={contactHistory} onChange={e => setContactHistory(e.target.value)} placeholder="고객과의 연락 기록을 입력하세요..." /></div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">프로젝트 데이터를 불러오는 중...</div>
      )}

      <DialogFooter>
        <Button variant="outline">취소</Button>
        <Button onClick={handleSave}>저장</Button>
      </DialogFooter>
    </>
  );
}

export default ProjectInfoModal;