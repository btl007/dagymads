/**
 * @file AdminSchedulePickerModal.jsx
 * @description 관리자가 프로젝트의 촬영일을 수동으로 지정하거나 변경하기 위한 모달 컴포넌트입니다.
 *
 * @logic
 * 이 컴포넌트는 기존 `UserScheduleModal.jsx`를 복제하여 관리자용으로 재구성되었습니다.
 * 고객용 모달과의 핵심적인 차이점은 다음과 같습니다.
 * 1. `get_available_slots` RPC 대신, 예약 불가능한 슬롯을 포함한 모든 슬롯을 가져오는 RPC를 호출합니다.
 * 2. 관리자는 모든 슬롯의 상태(예약 가능, 대기, 확정)를 시각적으로 확인하고 선택할 수 있습니다.
 * 3. 슬롯 선택 시 '예약 요청'이 아닌, 즉시 '일정 확정'을 처리하는 RPC(`confirm_schedule_slot`)를 호출합니다.
 *
 * 이 접근 방식은 새로운 백엔드 로직을 최소화하고, 기존의 안정적인 슬롯 기반 시스템을 재사용하여
 * 데이터 무결성을 보장하면서 관리자의 수동 일정 지정 기능을 구현하기 위해 채택되었습니다.
 */
import React, { useState, useMemo, useEffect } from 'react';
import { useSupabase } from './SupabaseProvider';
import { useUser } from '@clerk/clerk-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { CustomCalendar } from './CustomCalendar';

const AdminSchedulePickerModal = ({ project, isOpen, onClose }) => {
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
      // ADMIN CHANGE: Fetch all slots for the current month.
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { data, error } = await supabase.rpc('get_all_slots', {
        p_start_date: startDate,
        p_end_date: endDate
      });
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

  const handleBookingConfirm = async () => {
    if (!supabase || !user || !selectedSlot || !project) {
        toast.error("예약 확정에 필요한 정보가 부족합니다.");
        return;
    }
    setIsLoading(true);
    try {
        // ADMIN CHANGE: Use the direct confirmation RPC instead of requesting.
        const { error } = await supabase.rpc('confirm_schedule_slot', {
            p_project_id: project.id,
            p_confirmed_slot_id: selectedSlot.id
        });

        if (error) throw error;

        toast.success("촬영일이 성공적으로 확정되었습니다.");
        onClose(); // Close modal on success
    } catch (error) {
        console.error("Error confirming slot:", error);
        toast.error(`예약 확정에 실패했습니다: ${error.message}`);
    } finally {
        setIsLoading(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] bg-gray-900 text-white border-gray-700">
        <DialogHeader>
          <DialogTitle>촬영일 수동 지정</DialogTitle>
          <DialogDescription>
            {project ? `'${project.name}' 프로젝트의 촬영일을 지정합니다.` : '프로젝트 정보를 불러오는 중...'}
          </DialogDescription>
        </DialogHeader>
        
        {view === 'calendar' && (
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4 text-center">1. 원하시는 날짜를 선택하세요.</h3>
            <p className="text-center text-sm text-gray-400 mb-4">(모든 슬롯 현황이 표시됩니다.)</p>
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
                availableSlots.map(slot => {
                  const isSelected = selectedSlot?.id === slot.id;
                  const isConfirmedForThisProject = slot.booking_status === 'confirmed' && slot.project_id === project.id;
                  const isConfirmedForOther = slot.booking_status === 'confirmed' && slot.project_id !== project.id;
                  const isPending = slot.booking_status === 'pending';

                  let variant = 'outline';
                  if (isSelected) variant = 'default';
                  if (isConfirmedForThisProject) variant = 'success'; // Custom variant or style needed
                  if (isPending) variant = 'secondary';

                  return (
                    <Button
                      key={slot.id}
                      variant={variant}
                      disabled={isConfirmedForOther}
                      onClick={() => handleSlotSelect(slot)}
                      className={`w-full ${isConfirmedForThisProject ? 'bg-green-600 text-white' : ''}`}
                    >
                      {new Date(slot.slot_time).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })}
                      {isConfirmedForOther && <span className="text-xs ml-1">(예약됨)</span>}
                      {isPending && <span className="text-xs ml-1">(대기중)</span>}
                    </Button>
                  );
                })
              ) : (
                <p className="col-span-full text-center text-gray-400">선택하신 날짜에 생성된 슬롯이 없습니다.</p>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-6">
            {view === 'time' && (
                 <Button 
                    onClick={handleBookingConfirm} 
                    disabled={!selectedSlot || isLoading}
                    className="w-full"
                    size="lg"
                 >
                    {isLoading ? "확정 중..." : `${new Date(selectedSlot?.slot_time).toLocaleString('ko-KR') || ''} 이 시간으로 확정`}
                 </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminSchedulePickerModal;
