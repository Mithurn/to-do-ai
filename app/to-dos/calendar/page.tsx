"use client";

import TaskCalendar from '../Components/TasksArea/TaskCalendar';
import { useTasksStore } from '../../stores/useTasksStore';

export default function CalendarPage() {
  const { tasks } = useTasksStore();

  return (
    <div className="min-h-screen bg-[#f7f9fb] p-8">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Calendar View</h1>
      </div>
      <TaskCalendar tasks={tasks} />
    </div>
  );
} 