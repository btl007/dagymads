import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { CustomCalendar } from './CustomCalendar';
import { toast } from 'sonner';
import { format, addDays, startOfDay, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

const UserScheduleModal = ({ projectId, initialRequiredSchedules, isOpen, onClose, onSave }) => {
  const { supabase, isLoading: isSupabaseLoading } = useSupabase();
  const [schedulesData, setSchedulesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [selectedSlots, setSelectedSlots] = useState([]); // { date: 'YYYY-MM-DD', time: 'HH:MM', type: 'mandatory' | 'optional' }
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (!isSupabaseLoading && supabase) {
        fetchGlobalSchedules();
      }
      // Initialize selectedSlots from initialRequiredSchedules
      if (initialRequiredSchedules && initialRequiredSchedules.length > 0) {
        setSelectedSlots(initialRequiredSchedules.map(s => ({
          date: s.date,
          time: s.time,
          type: s.type || 'optional' // Default to optional if not specified
        })));
      } else {
        setSelectedSlots([]);
      }
    }
  }, [isOpen, initialRequiredSchedules, isSupabaseLoading, supabase]);

  const fetchGlobalSchedules = useCallback(async () => {
    if (isSupabaseLoading || !supabase) return;
    const { data, error } = await supabase
      .from('schedules')
      .select('slots')
      .single();

    if (error) {
      console.error('Error fetching global schedules:', error);
      toast.error('가용 스케줄 정보를 불러오는데 실패했습니다.');
      setLoading(false);
      return;
    }
    setSchedulesData(data.slots);
    setLoading(false);
  }, [supabase, isSupabaseLoading]);

  const getAvailableSlotsForDate = (date) => {
    if (!schedulesData) return {};
    const dateStr = format(date, 'yyyy-MM-dd');
    const daySchedule = schedulesData.find(s => s.date === dateStr);
    return daySchedule ? daySchedule.slots : {};
  };

  const handleSlotClick = (dateStr, time) => {
    const slotIdentifier = { date: dateStr, time: time };
    const isSelected = selectedSlots.some(s => s.date === dateStr && s.time === time);

    if (isSelected) {
      // Deselect
      setSelectedSlots(prev => prev.filter(s => !(s.date === dateStr && s.time === time)));
    } else {
      // Select
      if (selectedSlots.length >= 3) {
        toast.warning('최대 3개의 슬롯만 선택할 수 있습니다 (필수 1개, 희망 2개).');
        return;
      }

      // Determine type: first selection is mandatory, others are optional
      const newType = selectedSlots.length === 0 ? 'mandatory' : 'optional';
      setSelectedSlots(prev => [...prev, { ...slotIdentifier, type: newType }]);
    }
  };

  const handleSave = async () => {
    if (selectedSlots.length === 0) {
      toast.error('최소 1개의 희망 일정을 선택해주세요.');
      return;
    }
    if (!selectedSlots.some(s => s.type === 'mandatory')) {
      // If no mandatory slot is explicitly set, make the first one mandatory
      const slotsToSave = selectedSlots.map((s, index) => 
        index === 0 ? { ...s, type: 'mandatory' } : s
      );
      onSave(slotsToSave);
    } else {
      onSave(selectedSlots);
    }
    onClose();
  };

  const renderTimeSlots = () => {
    if (loading || isSupabaseLoading) return <p>시간 슬롯을 불러오는 중...</p>;
    if (!schedulesData) return <p>가용 스케줄 정보가 없습니다.</p>;

    const availableSlots = getAvailableSlotsForDate(selectedDate);
    const timeSlots = Array.from({ length: 19 }, (_, i) => format(new Date().setHours(6 + i, 0, 0, 0), 'HH:mm')); // 06:00 to 24:00
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    return (
      <div className="grid grid-cols-4 gap-2 max-h-[400px] overflow-y-auto pr-2">
        {timeSlots.map(time => {
          const isAvailable = availableSlots[time];
          const isSelected = selectedSlots.some(s => s.date === dateStr && s.time === time);
          const slotType = selectedSlots.find(s => s.date === dateStr && s.time === time)?.type;

          return (
            <Button
              key={time}
              variant={isSelected ? (slotType === 'mandatory' ? 'default' : 'secondary') : 'outline'}
              className={`w-full ${!isAvailable && 'opacity-50 cursor-not-allowed'}`}
              onClick={() => isAvailable && handleSlotClick(dateStr, time)}
              disabled={!isAvailable}
            >
              {time} {slotType === 'mandatory' && '(필수)'}
            </Button>
          );
        })}
      </div>
    );
  };

  const highlightedDates = schedulesData
    ? schedulesData.filter(day => Object.values(day.slots).some(slot => slot))
                   .map(day => parseISO(day.date))
    : [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>희망 촬영일 선택 (필수 1개, 희망 2개)</DialogTitle>
        </DialogHeader>
        {loading || isSupabaseLoading ? (
          <p>스케줄 정보를 불러오는 중...</p>
        ) : (
          <div className="flex flex-col md:flex-row gap-4 py-4">
            <div className="md:w-1/2">
              <CustomCalendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="w-full rounded-md border mx-auto"
                locale={ko}
                modifiers={{
                  highlighted: highlightedDates,
                }}
                modifiersStyles={{
                  highlighted: {
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    borderRadius: '0.375rem',
                  },
                }}
              />
              <div className="mt-4 p-2 border rounded-md">
                <h3 className="font-semibold mb-2">선택된 일정:</h3>
                {selectedSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">선택된 일정이 없습니다.</p>
                ) : (
                  <ul className="list-disc pl-5 text-sm">
                    {selectedSlots.map((slot, index) => (
                      <li key={index}>
                        {format(parseISO(slot.date), 'yyyy년 MM월 dd일', { locale: ko })} {slot.time} ({slot.type === 'mandatory' ? '필수' : '희망'})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="md:w-1/2">
              <h3 className="text-lg font-semibold mb-2">
                {format(selectedDate, 'yyyy년 MM월 dd일', { locale: ko })} 가용 시간
              </h3>
              {renderTimeSlots()}
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={isSaving || selectedSlots.length === 0}>
            {isSaving ? '저장 중...' : '일정 요청'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UserScheduleModal;
