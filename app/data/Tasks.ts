export type Task = {
  id: string;
  name: string;
  priority: "low" | "medium" | "high";
  status: "in progress" | "completed";
  userId: string;
  startTime?: string;  // optional for calendar
  endTime?: string;    // optional for calendar
};


export const allTasks: Task[] = [
  //
];
