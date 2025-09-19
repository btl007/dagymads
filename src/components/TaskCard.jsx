import { useSortable } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, parseISO, differenceInDays } from 'date-fns';
import { useUserCache } from "../contexts/UserCacheContext";

function TaskCard({ task }) {
  const { userCache } = useUserCache();

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: task.id,
      data: {
        type: "Task",
        task,
      },
    });

  const style = {
    transition,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  const centerName = userCache[task.user_id]?.username || '...';
  const memberName = task.user_profiles?.member_name || 'N/A';
  const projectName = task.name || 'Untitled Project';
  const createdAt = task.created_at ? parseISO(task.created_at) : null;
  const daysElapsed = createdAt ? differenceInDays(new Date(), createdAt) : null;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-gray-800 rounded-lg shadow-md h-[150px]"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-gray-800 border-gray-700 text-white hover:ring-2 hover:ring-inset hover:ring-rose-500 cursor-grab relative">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold truncate" title={centerName}>
            {centerName}
          </CardTitle>
          {createdAt && (
            <span className="text-xs font-semibold text-white whitespace-nowrap bg-blue-600 rounded-md px-2 py-1">
              D+{daysElapsed}일
            </span>
          )}
        </CardHeader>
        <CardContent className="p-3 text-xs text-gray-400 space-y-2">
          <div>
            <span className="font-semibold text-gray-300">생성일: </span>
            <span>{createdAt ? format(createdAt, 'yyyy-MM-dd') : 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-300">센터 담당자: </span>
            <span className="truncate" title={memberName}>{memberName}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-300">프로젝트명: </span>
            <span className="truncate" title={projectName}>{projectName}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskCard;