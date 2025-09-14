import React, { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '../components/SupabaseProvider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { CustomCalendar } from '../components/CustomCalendar';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const AdminVideo = () => {
  const supabase = useSupabase(); // CORRECTED: No destructuring
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [newShootDate, setNewShootDate] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch all projects that have a shootdate
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .not('shootdate', 'is', null) // We only care about projects with shootdates here
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      const userIds = [...new Set(projectsData.map(p => p.user_id))];
      if (userIds.length === 0) {
        setProjects([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch Clerk user details for center names (username)
      const response = await fetch('https://jymezpvjdcsdxfreozry.supabase.co/functions/v1/get-clerk-user-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds }),
      });
      if (!response.ok) throw new Error('Failed to fetch user details from Clerk');
      const usersData = await response.json();

      // 3. Combine all data
      const combinedData = projectsData.map(project => ({
        ...project,
        center_name: usersData[project.user_id]?.username || 'N/A',
      }));

      setProjects(combinedData);

    } catch (err) {
      console.error('Error fetching project data in AdminVideo:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toYYYYMMDD = (date) => {
    if (!date) return null;
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const projectsOnSelectedDate = selectedDate
    ? projects.filter(p => p.shootdate === toYYYYMMDD(selectedDate))
    : [];

  // Create an array of Date objects for the CustomCalendar
  const highlightedDates = projects
    .map(p => p.shootdate)
    .filter(Boolean)
    .map(dateStr => new Date(dateStr + 'T00:00:00')); // Treat date string as local

  const handleUpdateShootDate = async () => {
    if (!editingProject || !newShootDate) return;

    const newDateString = toYYYYMMDD(newShootDate);

    try {
      const { error } = await supabase
        .from('projects')
        .update({ shootdate: newDateString })
        .eq('id', editingProject.id);

      if (error) throw error;

      toast.success("일정이 정상적으로 변경되었습니다.");

      // Refresh data and close modal
      await fetchData();
      setIsDialogOpen(false);
      setEditingProject(null);

    } catch (err) {
      console.error('Error updating shootdate:', err);
      // You might want to show an error message to the user
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <div className="flex h-full p-4 md:p-8 gap-4">
        {/* Left Panel: Calendar */}
        <div className="w-1/2 h-full">
          <Card className="h-full bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>촬영일 캘린더</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <CustomCalendar 
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                highlightedDates={highlightedDates}
                className="w-full rounded-md border-0 bg-transparent"
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Panel: Project Details */}
        <div className="w-1/2 h-full">
          <Card className="h-full bg-gray-800 border-gray-700 text-white">
            <CardHeader>
              <CardTitle>
                {selectedDate ? `${selectedDate.toLocaleDateString()} 촬영 정보` : '날짜를 선택하세요'}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-y-auto">
              {isLoading ? (
                <div className="text-center text-gray-400 mt-10">로딩 중...</div>
              ) : error ? (
                <div className="text-center text-red-400 mt-10">에러: {error}</div>
              ) : selectedDate && projectsOnSelectedDate.length > 0 ? (
                <div className="space-y-4">
                  {projectsOnSelectedDate.map(project => (
                    <DialogTrigger asChild key={project.id} onClick={() => {
                      setEditingProject(project);
                      setNewShootDate(project.shootdate ? new Date(project.shootdate + 'T00:00:00') : new Date());
                      setIsDialogOpen(true);
                    }}>
                      <Card className="bg-gray-900/70 border-gray-700 flex items-center p-4 cursor-pointer hover:bg-gray-800">
                        <div className="flex-grow">
                          <p className="text-lg font-semibold text-slate-200">{project.center_name}</p>
                          <p className="text-sm text-slate-400">{project.name}</p>
                        </div>
                        <Button variant="outline" size="sm">촬영일 변경</Button>
                      </Card>
                    </DialogTrigger>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 mt-10">
                  {selectedDate ? '해당 날짜에 예정된 촬영이 없습니다.' : '캘린더에서 날짜를 선택하여 촬영 정보를 확인하세요.'}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DialogContent className="bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>촬영일 변경: {editingProject?.name}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
            <CustomCalendar
                mode="single"
                selected={newShootDate}
                onSelect={setNewShootDate}
                initialFocus
                className="w-full"
            />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="secondary">취소</Button>
          </DialogClose>
          <Button type="button" onClick={handleUpdateShootDate}>저장</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminVideo;
