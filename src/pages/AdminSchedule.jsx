import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { format, startOfMonth, endOfMonth, startOfDay, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';
import { useSupabase } from '@/components/SupabaseProvider';
import { CustomCalendar } from '@/components/CustomCalendar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const AdminSchedule = () => {
  const supabase = useSupabase();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [stagedChanges, setStagedChanges] = useState({});

  const fetchSlots = useCallback(async (month) => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(month), 'yyyy-MM-dd');

    try {
      const { data, error: rpcError } = await supabase.rpc('get_all_slots', {
        p_start_date: `${startDate}T00:00:00Z`,
        p_end_date: `${endDate}T23:59:59Z`,
      });

      if (rpcError) throw rpcError;
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err.message);
      toast.error('슬롯 데이터 로딩 실패', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchSlots(currentMonth);
  }, [currentMonth, fetchSlots]);

  const dailySlots = useMemo(() => {
    return slots
      .filter(slot => isSameDay(new Date(slot.slot_time), selectedDay))
      .sort((a, b) => new Date(a.slot_time) - new Date(b.slot_time));
  }, [slots, selectedDay]);

  const handleGenerateSlots = async () => {
    if (!supabase) return;
    const dateString = format(selectedDay, 'yyyy-MM-dd');
    const confirmation = confirm(`${dateString} 날짜의 슬롯을 생성하시겠습니까? 이미 슬롯이 있다면 중복 생성될 수 있습니다.`);
    if (!confirmation) return;

    setIsLoading(true);
    try {
      const { error } = await supabase.rpc('manual_generate_slots', {
        p_target_date: dateString,
      });

      if (error) throw error;
      toast.success(`${dateString}의 슬롯이 생성되었습니다.`);
      fetchSlots(currentMonth); // Refresh data
    } catch (err) {
      toast.error('슬롯 생성 실패', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotChange = (slotId, checked) => {
    setStagedChanges(prev => ({ ...prev, [slotId]: checked }));
  };

  const handleSelectAll = (isOpen) => {
    const changes = {};
    dailySlots.forEach(slot => {
      if (slot.booking_status === 'available') {
        changes[slot.id] = isOpen;
      }
    });
    setStagedChanges(prev => ({ ...prev, ...changes }));
  };

  const handleSaveChanges = async () => {
    if (!supabase) return;
    const changesToApply = Object.keys(stagedChanges);
    if (changesToApply.length === 0) {
      toast.info('변경된 내용이 없습니다.');
      return;
    }
    setIsSaving(true);

    const slotsToOpen = changesToApply.filter(id => stagedChanges[id] === true).map(Number);
    const slotsToClose = changesToApply.filter(id => stagedChanges[id] === false).map(Number);

    try {
      const promises = [];
      if (slotsToOpen.length > 0) {
        promises.push(supabase.rpc('update_slot_availability', {
          p_slot_ids: slotsToOpen,
          p_is_open: true,
        }));
      }
      if (slotsToClose.length > 0) {
        promises.push(supabase.rpc('update_slot_availability', {
          p_slot_ids: slotsToClose,
          p_is_open: false,
        }));
      }
      
      const results = await Promise.all(promises);
      results.forEach(result => { if (result.error) throw result.error; });

      toast.success('변경사항이 성공적으로 저장되었습니다.');
      setStagedChanges({});
      fetchSlots(currentMonth);
    } catch (err) {
      toast.error('저장 실패', { description: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-3xl font-bold text-white">스케줄 관리</h1>
        <Button onClick={handleGenerateSlots}>선택일 슬롯 수동 생성</Button>
      </div>
      <p className="text-lg text-slate-400 mb-8">시간 슬롯의 예약 가능 여부(is_open)를 관리합니다.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 bg-card p-4 rounded-lg border">
          <CustomCalendar
            mode="single"
            locale={ko}
            selected={selectedDay}
            onSelect={setSelectedDay}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            highlightedDates={useMemo(() => Array.from(new Set(slots.map(s => format(new Date(s.slot_time), 'yyyy-MM-dd')))).map(d => new Date(d)), [slots])}
            className="w-full rounded-md p-0 border-0 bg-transparent" />
        </div>

        <div className="md:col-span-1 bg-card p-4 rounded-lg border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">{format(selectedDay, 'yyyy년 MM월 dd일')} 슬롯 현황</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => handleSelectAll(true)}>전체 열기</Button>
              <Button size="sm" variant="outline" onClick={() => handleSelectAll(false)}>전체 닫기</Button>
            </div>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)
            ) : dailySlots.length > 0 ? (
              dailySlots.map(slot => {
                const isBooked = slot.booking_status !== 'available';
                const isChecked = stagedChanges[slot.id] ?? slot.is_open;
                return (
                  <div key={slot.id} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        id={`slot-${slot.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => handleSlotChange(slot.id, checked)}
                        disabled={isBooked || isSaving}
                      />
                      <label htmlFor={`slot-${slot.id}`} className={`font-mono ${isBooked ? 'text-muted-foreground' : ''}`}>
                        {format(new Date(slot.slot_time), 'HH:00')} - {format(new Date(slot.slot_time).setHours(new Date(slot.slot_time).getHours() + 1), 'HH:00')}
                      </label>
                    </div>
                    {isBooked && <span className="text-sm font-semibold text-yellow-500">이미 예약된 일정</span>}
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground pt-10 text-center">해당 날짜에 생성된 슬롯이 없습니다.</p>
            )}
          </div>
           <div className="mt-4 flex justify-end">
              <Button onClick={handleSaveChanges} disabled={isSaving || Object.keys(stagedChanges).length === 0}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                변경사항 저장
              </Button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSchedule;