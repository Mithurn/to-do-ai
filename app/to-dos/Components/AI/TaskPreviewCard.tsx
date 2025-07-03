import React from "react";

export interface TaskPreviewCardProps {
  name: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in progress' | 'completed';
  due_date?: string;
  estimated_time?: number;
  category?: string;
  editable?: boolean;
  onChange?: (task: Omit<TaskPreviewCardProps, 'onChange'>) => void;
}

/**
 * TaskPreviewCard displays a single AI-generated task in a styled card, with optional inline editing.
 */
export const TaskPreviewCard: React.FC<TaskPreviewCardProps> = ({
  name,
  description,
  priority,
  status,
  due_date,
  estimated_time,
  category,
  editable = false,
  onChange,
}) => {
  const priorityColor =
    priority === 'High' ? 'bg-red-500 text-white' :
    priority === 'Medium' ? 'bg-yellow-400 text-black' :
    'bg-green-500 text-white';

  // Handlers for inline editing
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange({ name: e.target.value, description, priority, status, due_date, estimated_time, category, editable });
  };
  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) onChange({ name, description, priority: e.target.value as any, status, due_date, estimated_time, category, editable });
  };
  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) onChange({ name, description, priority, status: e.target.value as any, due_date, estimated_time, category, editable });
  };

  return (
    <div className="rounded-2xl bg-white dark:bg-zinc-900 shadow-md p-5 mb-4 border border-zinc-100 dark:border-zinc-800 transition-all flex flex-col gap-2">
      <div className="flex items-center gap-2">
        {editable ? (
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="font-bold text-lg text-zinc-900 dark:text-zinc-100 bg-transparent border-b border-zinc-200 dark:border-zinc-700 focus:outline-none focus:border-blue-500 rounded px-1 min-w-[100px]"
            maxLength={100}
          />
        ) : (
          <span className="font-bold text-lg text-zinc-900 dark:text-zinc-100">{name}</span>
        )}
        {editable ? (
          <select
            value={priority}
            onChange={handlePriorityChange}
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 ${priorityColor}`}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        ) : (
          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${priorityColor}`}>{priority}</span>
        )}
        {category && <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">{category}</span>}
      </div>
      {description && <div className="text-sm text-zinc-700 dark:text-zinc-300">{description}</div>}
      <div className="flex flex-wrap gap-3 mt-1 text-xs items-center">
        {editable ? (
          <>
            <label className="mr-1">Status:</label>
            <select
              value={status}
              onChange={handleStatusChange}
              className="inline-flex items-center px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            >
              <option value="pending">Pending</option>
              <option value="in progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">Status: {status}</span>
        )}
        {due_date && <span className="inline-flex items-center px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100">Due: {new Date(due_date).toLocaleDateString()}</span>}
        {typeof estimated_time === 'number' && <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-100">Est: {estimated_time}h</span>}
      </div>
    </div>
  );
}; 