import { useSortable } from "@dnd-kit/sortable";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { format, parseISO, differenceInDays } from 'date-fns';
import { useUserCache } from "../contexts/UserCacheContext";
import { Badge } from "@/components/ui/badge";
import { PencilIcon } from 'lucide-react';

function TaskCard({ task, onViewDetails }) {
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

  // Explicitly define each name for clarity
  const centerName = task.user_profiles?.center_name;
  const username = userCache[task.user_id]?.username || '...';
  const memberName = task.user_profiles?.member_name || 'N/A';
  const projectName = task.name || 'Untitled Project';
  const createdAt = task.created_at ? parseISO(task.created_at) : null;
  const daysElapsed = createdAt ? differenceInDays(new Date(), createdAt) : null;

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="opacity-50 bg-card rounded-lg shadow-md h-[150px] border-border"
      />
    );
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card className="bg-card text-card-foreground border-border hover:ring-2 hover:ring-inset hover:ring-primary cursor-grab relative">
        <CardHeader className="p-3 flex flex-row items-center justify-between">
          <div className="truncate">
            <CardTitle className="text-base font-bold truncate" title={centerName || username}>
              {centerName || username}
            </CardTitle>
            {/* Only show username separately if centerName exists */}
            {centerName && (
              <p className="text-xs text-muted-foreground truncate" title={username}>
                ({username})
              </p>
            )}
          </div>
          <div className="flex items-center gap-2"> {/* Wrap badge and button */}
            {createdAt && (
              <Badge variant="secondary" className="text-xs font-semibold whitespace-nowrap">
                D+{daysElapsed}일
              </Badge>
            )}
            {/* Add the edit button */}
            <button
              className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground"
              onClick={() => onViewDetails(task)} // Assuming onViewDetails is passed as a prop
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-3 text-sm text-muted-foreground space-y-2">
          <div>
            <span className="font-semibold text-foreground">생성일: </span>
            <span>{createdAt ? format(createdAt, 'yyyy-MM-dd') : 'N/A'}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">센터 담당자: </span>
            <span className="truncate" title={memberName}>{memberName}</span>
          </div>
          <div>
            <span className="font-semibold text-foreground">프로젝트명: </span>
            <span className="truncate" title={projectName}>{projectName}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default TaskCard;