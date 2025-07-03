import React from "react";
import { TaskPreviewCard, TaskPreviewCardProps } from "./TaskPreviewCard";

export interface TaskListProps {
  tasks: TaskPreviewCardProps[];
  editable?: boolean;
  onTaskChange?: (idx: number, task: Omit<TaskPreviewCardProps, 'onChange'>) => void;
}

/**
 * TaskList renders a list of TaskPreviewCard components, optionally editable.
 */
export const TaskList: React.FC<TaskListProps> = ({ tasks, editable = false, onTaskChange }) => {
  if (!tasks.length) return null;
  return (
    <div className="flex flex-col gap-4 mt-2">
      {tasks.map((task, idx) => (
        <TaskPreviewCard
          key={task.name + idx}
          {...task}
          editable={editable}
          onChange={onTaskChange ? (t) => onTaskChange(idx, t) : undefined}
        />
      ))}
    </div>
  );
}; 