/**
 * Represents a task, including all fields supported by AI and DB.
 */
export type Task = {
  id: string;
  name: string;
  /** Optional description of the task */
  description?: string;
  priority: "low" | "medium" | "high";
  /** Task status */
  status: "pending" | "in progress" | "completed";
  userId: string;
  /** Optional due date (ISO string) */
  due_date?: string;
  /** Optional estimated time to complete (in hours, as string or number) */
  estimated_time?: string | number;
  /** Optional category */
  category?: string;
  /** Optional dependencies (array of task IDs or names) */
  dependencies?: string[];
  startTime?: string;  // optional for calendar
  endTime?: string;    // optional for calendar
};


export const allTasks: Task[] = [
  //
];
