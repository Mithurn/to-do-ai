"use client";

import TaskCalendar from '../Components/TasksArea/TaskCalendar';
import { useTasksStore } from '../../stores/useTasksStore';
import { useUserStore } from '../../stores/useUserStore';
import { TasksDialog } from '../Components/Dialogs/TaskDialog/TaskDialog';
import { useEffect, useState } from 'react';

export default function CalendarPage() {
  const { tasks, fetchTasks, isLoading } = useTasksStore();
  const { user, validateUser, isLoading: userLoading } = useUserStore();
  const [userChecked, setUserChecked] = useState(false);

  useEffect(() => {
    async function checkUser() {
      await validateUser();
      setUserChecked(true);
    }
    checkUser();
  }, [validateUser]);

  useEffect(() => {
    if (user) {
      fetchTasks(user);
    }
  }, [user, fetchTasks]);

  if (!userChecked || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-12 flex flex-col gap-6">
        <div className="sticky top-0 z-30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2 bg-card/80 backdrop-blur-md shadow-card px-2 py-4 rounded-xl transition-all duration-300">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">Calendar View</h1>
          <div className="flex gap-3">
            <TasksDialog />
          </div>
        </div>
        <div className="border-t border-border mb-2" />
        <div className="w-full bg-card rounded-xl shadow-card p-6 min-h-[600px] h-[80vh] flex flex-col justify-stretch overflow-x-auto">
          <TaskCalendar tasks={tasks} />
        </div>
      </div>
    </div>
  );
} 