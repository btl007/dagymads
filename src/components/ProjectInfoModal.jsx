import React, { useState, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { PROJECT_STATUSES } from '../data/projectStatuses';

const ProjectInfoModal = ({ project, userName, onSave, onClose }) => {
  const supabase = useSupabase();

  // State for editable fields
  const [address, setAddress] = useState('');
  const [memberName, setMemberName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState('');
  const [frameIoLink, setFrameIoLink] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [contactHistory, setContactHistory] = useState('');
  const [userInfo, setUserInfo] = useState('');
  const [cameraCrew, setCameraCrew] = useState('');
  const [confirmedSlot, setConfirmedSlot] = useState(null);

  useEffect(() => {
    if (project) {
      // Set state from project prop
      setAddress(project.user_profiles?.address || '');
      setMemberName(project.user_profiles?.member_name || '');
      setPhoneNumber(project.user_profiles?.phone_number || '');
      setStatus(project.status || '');
      setFrameIoLink(project.frame_io_link || '');
      setYoutubeLink(project.youtube_link || '');
      setContactHistory(project.contact_history || '');
      setUserInfo(project.user_profiles?.info || '');
      setCameraCrew(project.camera_crew || '');

      // Fetch confirmed slot time if project is in a relevant state
      if (project.id && project.status === 'schedule_fixed') {
        const fetchConfirmedSlot = async () => {
          const { data: slotData, error: slotError } = await supabase
            .from('time_slots')
            .select('slot_time')
            .eq('project_id', project.id)
            .eq('booking_status', 'confirmed')
            .single();
          if (slotData) {
            setConfirmedSlot(slotData);
          }
        };
        fetchConfirmedSlot();
      } else {
        setConfirmedSlot(null);
      }
    }
  }, [project, supabase]);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const formatShootDateTime = (dateString) => {
    if (!dateString) return '미확정';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:00`;
  };

  const calculateDaysElapsed = (dateString) => {
    const createdDate = new Date(dateString);
    const today = new Date();
    const differenceInTime = today.getTime() - createdDate.getTime();
    const differenceInDays = Math.floor(differenceInTime / (1000 * 3600 * 24));
    return differenceInDays;
  };

  const handleSaveClick = () => {
    if (!onSave) return;

    const projectChanges = {
      id: project.id,
      status,
      frame_io_link: frameIoLink,
      youtube_link: youtubeLink,
      contact_history: contactHistory,
      camera_crew: cameraCrew,
    };

    const profileChanges = {
      user_id: project.user_id,
      info: userInfo,
      address: address,
      member_name: memberName,
      phone_number: phoneNumber,
    };

    onSave(projectChanges, profileChanges);
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
            <div className="space-y-2"><Label htmlFor="memberName">센터 담당자</Label><Input id="memberName" value={memberName} onChange={e => setMemberName(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="phoneNumber">센터 담당자 연락처</Label><Input id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="status">현재 상태</Label><Select value={status} onValueChange={setStatus}><SelectTrigger id="status"><SelectValue placeholder="상태 선택..." /></SelectTrigger><SelectContent>{PROJECT_STATUSES.map(s => <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2">
              <Label>프로젝트 개설일</Label>
              <div className="flex items-center pt-2">
                <p className="text-sm font-semibold">{formatDate(project.created_at)}</p>
                <Badge variant="secondary" className="ml-2">D+{calculateDaysElapsed(project.created_at)}일</Badge>
              </div>
            </div>
            <div className="space-y-2"><Label>촬영일</Label><p className="text-sm font-semibold pt-2 text-cyan-400">{formatShootDateTime(confirmedSlot?.slot_time)}</p></div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList>
              <TabsTrigger value="details">상세 정보</TabsTrigger>
              <TabsTrigger value="video">촬영/영상 관리</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div>
                <Label htmlFor="userInfo">특이사항</Label>
                <textarea id="userInfo" className="mt-2 w-full h-32 p-2 bg-slate-800 border border-slate-700 rounded-md text-sm" value={userInfo} onChange={e => setUserInfo(e.target.value)} placeholder="센터 관련 특이사항을 입력하세요..." />
              </div>
              <div>
                <Label htmlFor="contactHistory">컨택 히스토리</Label>
                <textarea id="contactHistory" className="mt-2 w-full h-48 p-2 bg-slate-800 border border-slate-700 rounded-md text-sm" value={contactHistory} onChange={e => setContactHistory(e.target.value)} placeholder="고객과의 연락 기록을 입력하세요..." />
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-4 py-4">
              <div className="space-y-2"><Label htmlFor="cameraCrew">촬영팀</Label><Input id="cameraCrew" value={cameraCrew} onChange={e => setCameraCrew(e.target.value)} placeholder="참여한 촬영팀 입력..." /></div>
              <div className="space-y-2"><Label htmlFor="frameio">Frame.io 링크</Label><Input id="frameio" value={frameIoLink} onChange={e => setFrameIoLink(e.target.value)} placeholder="https://frame.io/..." /></div>
              <div className="space-y-2"><Label htmlFor="youtube">최종 YouTube 링크</Label><Input id="youtube" value={youtubeLink} onChange={e => setYoutubeLink(e.target.value)} placeholder="https://youtube.com/watch?v=..." /></div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="flex items-center justify-center h-full">프로젝트 데이터를 불러오는 중...</div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>취소</Button>
        <Button onClick={handleSaveClick}>저장</Button>
      </DialogFooter>
    </>
  );
}

export default ProjectInfoModal;