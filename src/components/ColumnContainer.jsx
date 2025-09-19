
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useMemo } from "react";
import TaskCard from "./TaskCard";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function ColumnContainer({ column, tasks, onViewDetails }) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: column.id,
      data: {
        type: "Column",
        column,
      },
    });

  const style = {
    transition,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
  };

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="w-[350px] h-[500px] max-h-[500px] flex flex-col opacity-40 border-2 border-rose-500 bg-card text-card-foreground"
      ></Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="w-[350px] h-[500px] max-h-[500px] flex flex-col bg-muted text-card-foreground border-border"
    >
      <CardHeader
        {...attributes}
        {...listeners}
        className="flex flex-row items-center justify-between space-y-0 p-3 border-b border-border cursor-grab"
      >
        <CardTitle className="text-md font-bold flex items-center gap-2">
          <Badge className="text-sm px-2 py-1 rounded-full bg-card text-card-foreground">
            {tasks.length}
          </Badge>
          {column.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-grow flex-col gap-4 p-2 overflow-x-hidden overflow-y-auto">
        <SortableContext items={tasksIds}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onViewDetails={onViewDetails}
            />
          ))}
        </SortableContext>
      </CardContent>
    </Card>
  );
}

export default ColumnContainer;
