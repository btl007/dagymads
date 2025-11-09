import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useSupabase } from '../components/SupabaseProvider';
import { useUserCache } from '../contexts/UserCacheContext';
import ColumnContainer from '../components/ColumnContainer';
import TaskCard from '../components/TaskCard';
import ProjectInfoModal from '../components/ProjectInfoModal';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PROJECT_STATUSES } from '../data/projectStatuses.js';
import { toast } from 'sonner';

const initialColumns = PROJECT_STATUSES.map(status => ({
  id: status.id,
  title: status.title,
}));

function AdminKanban() {
  const supabase = useSupabase();
  const { userCache, getUserNames } = useUserCache();
  const [columns, setColumns] = useState(initialColumns);
  const [tasks, setTasks] = useState([]);
  const [activeColumn, setActiveColumn] = useState(null);
  const [activeTask, setActiveTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  const fetchProjects = useCallback(async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase.from('projects').select('*, user_profiles(center_name, member_name)');
      if (error) throw error;

      setTasks(data.map(p => ({ ...p, id: p.id.toString() })));
      
      const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
      if (userIds.length > 0) {
        await getUserNames(userIds);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('프로젝트를 불러오는데 실패했습니다.');
    }
  }, [supabase, getUserNames]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
      },
    })
  );

  async function handleDragStart(event) {
    const { active } = event;
    const { data } = active;
    const { type, column, task } = data.current || {};

    if (type === 'Column') {
      setActiveColumn(column);
    } else if (type === 'Task') {
      setActiveTask(task);
    }
  }

  async function handleDragEnd(event) {
    setActiveColumn(null);
    setActiveTask(null);

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveAColumn = active.data.current?.type === 'Column';
    if (isActiveAColumn) {
      setColumns((columns) => {
        const activeColumnIndex = columns.findIndex((col) => col.id === activeId);
        const overColumnIndex = columns.findIndex((col) => col.id === overId);
        return arrayMove(columns, activeColumnIndex, overColumnIndex);
      });
      return;
    }

    const isActiveATask = active.data.current?.type === 'Task';
    if (isActiveATask) {
      const activeTask = active.data.current.task;
      const newStatus = over.data.current?.column?.id || over.id;

      if (supabase) {
        const { error } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', activeTask.id);

        if (error) {
          toast.error('프로젝트 상태 변경에 실패했습니다.', { description: error.message });
          return;
        }
      }
      fetchProjects(); // Refresh data after drag-and-drop status change
    }
  }

  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  const handleProjectSave = async (projectChanges, profileChanges) => {
    if (!supabase) return;
    try {
      const { error: projectError } = await supabase.from('projects').update(projectChanges).eq('id', projectChanges.id);
      const { error: profileError } = await supabase.from('user_profiles').update(profileChanges).eq('user_id', profileChanges.user_id);

      const error = projectError || profileError;
      if (error) throw error;

      toast.success('프로젝트가 성공적으로 업데이트되었습니다.');
      fetchProjects(); // Refresh Kanban data
      handleModalClose();
    } catch (error) {
      toast.error('프로젝트 업데이트에 실패했습니다.', { description: error.message });
    }
  };

  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="m-auto flex gap-4">
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <ColumnContainer
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.status === col.id)}
                onViewDetails={handleViewDetails}
              />
            ))}
          </SortableContext>
        </div>

        {createPortal(
          <DragOverlay>
            {activeColumn && (
              <ColumnContainer
                column={activeColumn}
                tasks={tasks.filter(
                  (task) => task.status === activeColumn.id
                )}
                onViewDetails={handleViewDetails}
              />
            )}
            {activeTask && (
              <TaskCard task={activeTask} onViewDetails={handleViewDetails} />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {selectedProject && (
        <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-[600px]">
            <ProjectInfoModal
              project={selectedProject}
              onSave={handleProjectSave}
              onClose={handleModalClose}
              userName={userCache[selectedProject.user_id]?.username}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminKanban;
