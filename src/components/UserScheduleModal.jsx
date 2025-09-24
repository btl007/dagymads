import React, { useState, useMemo, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useUser } from '@clerk/clerk-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CustomCalendar } from './CustomCalendar';

const UserScheduleModal = ({ project, isOpen, onClose }) => {
  const supabase = useSupabase();
  const { user } = useUser();
  const [view, setView] = useState('calendar'); // 'calendar' or 'time'
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [allSlots, setAllSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchSlots();
      // Reset state when modal opens
      setView('calendar');
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [isOpen, supabase]);

  const fetchSlots = async () => {
    if (!supabase) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_available_slots');
      if (error) throw error;
      setAllSlots(data);
    } catch (error) {
      console.error("Error fetching slots:", error);
      toast.error("예약 가능한 시간을 불러오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const highlightedDates = useMemo(() => {
    const openDates = allSlots
      .map(slot => new Date(slot.slot_time.split('T')[0]));
    // Deduplicate dates
    return [...new Set(openDates.map(date => date.toISOString().split('T')[0]))].map(dateStr => new Date(dateStr));
  }, [allSlots]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const slotsForDate = allSlots.filter(slot => {
      const slotDate = new Date(slot.slot_time); // Convert slot_time string to a Date object
      // Compare year, month, and day to avoid timezone issues
      return slotDate.getFullYear() === date.getFullYear() &&
             slotDate.getMonth() === date.getMonth() &&
             slotDate.getDate() === date.getDate();
    });
    setAvailableSlots(slotsForDate);
    setView('time');
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
  };

  const handleBookingRequest = async () => {
    if (!supabase || !user || !selectedSlot || !project) {
        toast.error("예약 요청에 필요한 정보가 부족합니다.");
        return;
    }
    setIsLoading(true);
    try {
        const { error } = await supabase.rpc('request_schedule_slots', {
            p_project_id: project.id,
            p_slot_ids: [selectedSlot.id],
            p_user_id: user.id
        });

        if (error) throw error;

        toast.success("촬영일 예약을 요청했습니다. 관리자 승인 후 확정됩니다.");
        onClose(); // Close modal on success
    } catch (error) {
        console.error("Error requesting slot:", error);
        toast.error(`예약 요청에 실패했습니다: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>촬영일 예약 요청</DialogTitle>
          <DialogDescription>
            {project ? `'${project.name}' 프로젝트의 촬영일을 선택하세요.` : '프로젝트 정보를 불러오는 중...'}
          </DialogDescription>
        </DialogHeader>
        
        {view === 'calendar' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">1. 원하시는 날짜를 선택하세요.</h3>
            <p className="text-center text-sm text-gray-400 mb-4">(예약 가능한 날짜는 파란색 점으로 표시됩니다.)</p>
            <CustomCalendar
              highlightedDates={highlightedDates}
              onSelect={handleDateSelect}
              className="w-full"
            />
          </div>
        )}

        {view === 'time' && selectedDate && (
          <div className="p-4">
            <Button onClick={() => setView('calendar')} variant="outline" className="mb-4">{'<'} 날짜 다시 선택</Button>
            <h3 className="text-lg font-semibold mb-4 text-center">2. 원하시는 시간을 선택하세요.</h3>
            <p className="text-center text-sm text-gray-400 mb-4">{selectedDate.toLocaleDateString('ko-KR')}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {availableSlots.length > 0 ? (
                availableSlots.map(slot => (
                  <Button
                    key={slot.id}
                    variant={selectedSlot?.id === slot.id ? 'default' : 'outline'}
                    onClick={() => handleSlotSelect(slot)}
                    className="w-full"
                  >
                    {new Date(slot.slot_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                  </Button>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-400">선택하신 날짜에 예약 가능한 시간이 없습니다.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
            {view === 'time' && (
                 <Button 
                    onClick={handleBookingRequest} 
                    disabled={!selectedSlot || isLoading}
                    className="w-full"
                    size="lg"
                 >
                    {isLoading ? "요청 중..." : `${new Date(selectedSlot?.slot_time).toLocaleString('ko-KR') || ''} 예약 요청`}
                 </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserScheduleModal;