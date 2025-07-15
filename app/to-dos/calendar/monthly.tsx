"use client";
import React, { useState } from "react";
import { useTasksStore } from "@/app/stores/useTasksStore";
import { Task } from "@/app/data/Tasks";
import { TasksDialog } from "../Components/Dialogs/TaskDialog/TaskDialog";
import { DayTaskModal } from "../Components/TasksArea/DayTaskModal";

const COLORS = {
  background: "#0f0f0f",
  surface: "#1b1b1b",
  border: "#2d2d2d",
  primaryText: "#f1f1f1",
  secondaryText: "#b0b0b0",
  accentBlue: "#3b82f6",
};
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthYear(date: Date) {
  return date.toLocaleDateString("en-US", { month: 'long', year: 'numeric' });
}

function getMonthGrid(year: number, month: number) {
  // Returns a 2D array of Date objects for the calendar grid
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const firstDayIdx = (firstDay.getDay() + 6) % 7; // Monday=0
  const daysInMonth = lastDay.getDate();
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevMonthYear = month === 0 ? year - 1 : year;
  const prevMonthLastDay = new Date(prevMonthYear, prevMonth + 1, 0).getDate();
  const grid: Date[][] = [];
  let day = 1 - firstDayIdx;
  for (let week = 0; week < 6; week++) {
    const row: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(year, month, day);
      row.push(date);
      day++;
    }
    grid.push(row);
    if (day > daysInMonth) break;
  }
  return grid;
}

export default function MonthlyCalendarPage() {
  const { tasks, setTaskSelected, setIsTaskDialogOpened, isTaskDialogOpened, taskSelected } = useTasksStore();
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const monthYear = getMonthYear(viewDate);
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const grid = getMonthGrid(year, month);

  // Modal state
  const [addModalDate, setAddModalDate] = useState<Date | null>(null);
  // Modal state for viewing all tasks in a day
  const [viewTasksDate, setViewTasksDate] = useState<Date | null>(null);

  // Filter tasks for the current month
  function isSameDay(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
  }
  function isSameMonth(d1: Date, d2: Date) {
    return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth();
  }
  function getTasksForDay(date: Date) {
    return (tasks || []).filter(task => {
      if (!task.startTime) return false;
      const t = new Date(task.startTime);
      return isSameDay(t, date);
    });
  }

  // Navigation
  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  // Add modal logic
  function handleDayClick(date: Date) {
    setTaskSelected(null);
    setAddModalDate(date);
    setIsTaskDialogOpened(true);
  }
  // Edit modal logic
  function handleTaskClick(task: Task) {
    setTaskSelected(task);
    setIsTaskDialogOpened(true);
  }

  // Reset addModalDate when modal closes
  React.useEffect(() => {
    if (!isTaskDialogOpened) {
      setAddModalDate(null);
    }
  }, [isTaskDialogOpened]);

  // Helper to get local YYYY-MM-DD string
  function toLocalDateString(date: Date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col" style={{ background: COLORS.background, color: COLORS.primaryText }}>
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 py-4 sm:py-6 border-b border-border bg-card/80 shadow-card sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-0">
          <button className="text-2xl text-muted-foreground hover:text-blue-400 transition" onClick={prevMonth}>&#8592;</button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{monthYear}</h1>
          <button className="text-2xl text-muted-foreground hover:text-blue-400 transition" onClick={nextMonth}>&#8594;</button>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 sm:px-5 py-2 rounded-xl shadow transition-all text-base w-full sm:w-auto"
          onClick={() => handleDayClick(today)}
        >
          Add New Task
        </button>
      </header>
      <main className="flex-1 flex flex-col items-stretch p-2 sm:p-8">
        <div className="w-full max-w-full sm:max-w-6xl mx-auto bg-card rounded-xl shadow-card p-2 sm:p-6 min-h-[400px] sm:min-h-[600px] h-[60vh] sm:h-[80vh] flex flex-col justify-stretch overflow-x-auto">
          {/* Days header */}
          <div className="grid grid-cols-7 mb-2 text-xs sm:text-sm">
            {DAYS.map(day => (
              <div key={day} className="text-center font-semibold pb-1 sm:pb-2" style={{ color: COLORS.secondaryText }}>{day}</div>
            ))}
          </div>
          {/* Month grid */}
          <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden min-w-[560px] sm:min-w-0" style={{ background: COLORS.border }}>
            {grid.flat().map((date, idx) => {
              const isCurrentMonth = isSameMonth(date, viewDate);
              const isToday = isSameDay(date, today);
              const dayTasks = getTasksForDay(date);
              const showMore = dayTasks.length > 1;
              return (
                <div
                  key={date.toISOString() + idx}
                  className={`relative min-h-[60px] sm:min-h-[90px] h-[80px] sm:h-[110px] p-1 sm:p-2 flex flex-col rounded-lg transition-colors duration-200 cursor-pointer ${isCurrentMonth ? 'bg-surface' : 'bg-background/60'} ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  style={{ background: isCurrentMonth ? COLORS.surface : COLORS.background, border: `1px solid ${COLORS.border}` }}
                  onClick={() => handleDayClick(date)}
                >
                  <div className={`text-[10px] sm:text-xs font-semibold mb-0.5 sm:mb-1 ${isCurrentMonth ? '' : 'opacity-40'}`}>{date.getDate()}</div>
                  <div className="flex flex-col gap-0.5 sm:gap-1 flex-1 overflow-y-auto">
                    {dayTasks.length > 0 && (
                      <div
                        key={dayTasks[0].id}
                        className="rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-xs font-medium truncate shadow-card mb-0.5 sm:mb-1 hover:scale-105 hover:shadow-lg transition"
                        style={{ background: COLORS.accentBlue, color: '#fff', cursor: 'pointer' }}
                        title={dayTasks[0].name}
                        onClick={e => { e.stopPropagation(); handleTaskClick(dayTasks[0]); }}
                      >
                        {dayTasks[0].name}
                      </div>
                    )}
                    {showMore && (
                      <button
                        className="text-[10px] sm:text-xs text-blue-400 underline mt-0.5 sm:mt-1 text-left"
                        onClick={e => { e.stopPropagation(); setViewTasksDate(date); }}
                        aria-label={`Show all tasks for ${date.toDateString()}`}
                      >
                        +{dayTasks.length - 1} more
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      {/* Add/Edit Task Modal (TasksDialog) */}
      <TasksDialog
        defaultDate={!taskSelected && addModalDate ? toLocalDateString(addModalDate) : undefined}
        showTrigger={false}
      />
      {/* View all tasks for a day modal */}
      <DayTaskModal
        open={!!viewTasksDate}
        onOpenChange={open => setViewTasksDate(open ? viewTasksDate : null)}
        date={viewTasksDate ? toLocalDateString(viewTasksDate) : null}
        tasks={tasks}
        addMode
      />
    </div>
  );
} 