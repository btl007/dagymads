
import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove } from '@dnd-kit/sortable';
import { useSupabase } from '../components/SupabaseProvider';
import { useUserCache } from '../contexts/UserCacheContext';
import ColumnContainer from '../components/ColumnContainer';
import TaskCard from '../components/TaskCard';
import ProjectInfoModal from '../components/ProjectInfoModal'; // Import ProjectInfoModal
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'; // Import Dialog components
import { PROJECT_STATUSES } from '../data/projectStatuses.js';

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

  // State for ProjectInfoModal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

  useEffect(() => {
    const fetchProjects = async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase.from('projects').select('*, user_profiles(member_name)');
        if (error) throw error;

        setTasks(data.map(p => ({ ...p, id: p.id.toString() }))); // Ensure task id is string
        
        const userIds = [...new Set(data.map(p => p.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          await getUserNames(userIds);
        }

      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };
    fetchProjects();
  }, [supabase, getUserNames]);

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

      // Update task status in the database
      if (supabase) {
        const { error } = await supabase
          .from('projects')
          .update({ status: newStatus })
          .eq('id', activeTask.id);

        if (error) {
          console.error('Error updating task status:', error);
          // Optionally revert the UI change here
          return;
        }
      }

      // Update UI optimistically
      setTasks((tasks) => {
        const activeIndex = tasks.findIndex((t) => t.id === activeId);
        if (activeIndex === -1) return tasks;
        tasks[activeIndex].status = newStatus;
        return [...tasks];
      });
    }
  }

  function handleDragOver(event) {
    // This function can be used to handle tasks moving between columns
    // For now, we handle this logic in onDragEnd
  }

  // Function to open the modal with selected project
  const handleViewDetails = (project) => {
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  // Function to handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Function to handle project save from modal
  const handleProjectSave = async (updatedProject) => {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', updatedProject.id);

      if (error) {
        console.error('Error updating project:', error);
        return;
      }

      // Update tasks state to reflect changes
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === updatedProject.id ? { ...task, ...updatedProject } : task
      ));
      handleModalClose(); // Close modal after save
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };


  return (
    <div className="m-auto flex min-h-screen w-full items-center overflow-x-auto overflow-y-hidden px-[40px]">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
      >
        <div className="m-auto flex gap-4">
          <SortableContext items={columnsId}>
            {columns.map((col) => (
              <ColumnContainer
                key={col.id}
                column={col}
                tasks={tasks.filter((task) => task.status === col.id)}
                onViewDetails={handleViewDetails} // Pass handler to ColumnContainer
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
                onViewDetails={handleViewDetails} // Pass handler to ColumnContainer
              />
            )}
            {activeTask && (
              <TaskCard task={activeTask} onViewDetails={handleViewDetails} />
            )}
          </DragOverlay>,
          document.body
        )}
      </DndContext>

      {/* Project Info Modal */}
      {selectedProject && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>프로젝트 상세 정보</DialogTitle>
              <DialogDescription>
                프로젝트의 상세 정보를 확인하고 수정할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            <ProjectInfoModal
              project={selectedProject}
              onClose={handleModalClose}
              onSave={handleProjectSave}
              userName={userCache[selectedProject.user_id]?.username}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default AdminKanban;
