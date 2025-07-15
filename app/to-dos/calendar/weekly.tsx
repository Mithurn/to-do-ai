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
const TIMES = Array.from({ length: 13 }, (_, i) => `${i + 8}:00`); // 8 AM to 8 PM

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  end.setHours(0, 0, 0, 0);
  return end;
}
function getWeekRange(date: Date) {
  const start = getStartOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' });
  return `${fmt(start)} – ${fmt(end)}`;
}
function getDayIndex(date: Date) {
  // Monday=0, Sunday=6
  return (date.getDay() + 6) % 7;
}

export default function WeeklyCalendarPage() {
  const { tasks, setTaskSelected, setIsTaskDialogOpened, isTaskDialogOpened, taskSelected } = useTasksStore();
  const today = new Date();
  const weekRange = getWeekRange(today);
  const weekStart = getStartOfWeek(today);
  const weekEnd = getEndOfWeek(today);

  // Modal state for pre-filling add modal
  const [addModalInfo, setAddModalInfo] = useState<{ dayIdx: number; timeIdx: number } | null>(null);
  // Modal state for viewing all tasks in a slot
  const [viewTasksSlot, setViewTasksSlot] = useState<{ dayIdx: number; timeIdx: number } | null>(null);

  // Filter tasks for this week
  const weeklyTasks = (tasks || []).filter((task: Task) => {
    if (!task.startTime) return false;
    const t = new Date(task.startTime);
    return t >= weekStart && t < weekEnd;
  });

  // Map: day index -> array of tasks
  const tasksByDay: Record<number, Task[]> = {};
  weeklyTasks.forEach(task => {
    if (!task.startTime) return;
    const t = new Date(task.startTime);
    const idx = getDayIndex(t);
    if (!tasksByDay[idx]) tasksByDay[idx] = [];
    tasksByDay[idx].push(task);
  });

  // Helper: get all tasks for a slot
  function getSlotTasks(dayIdx: number, timeIdx: number) {
    const slotHour = 8 + timeIdx;
    return (tasksByDay[dayIdx] || []).filter(task => {
      if (!task.startTime) return false;
      const t = new Date(task.startTime);
      return t.getHours() === slotHour;
    });
  }

  // Helper: get slot date/time string
  function getSlotDateTime(dayIdx: number, timeIdx: number) {
    const slotDate = new Date(weekStart);
    slotDate.setDate(slotDate.getDate() + dayIdx);
    slotDate.setHours(8 + timeIdx, 0, 0, 0);
    const dateStr = slotDate.toISOString().split('T')[0];
    const timeStr = slotDate.toTimeString().slice(0, 5);
    return { dateStr, timeStr };
  }

  // Open add modal with pre-filled date/time
  function handleSlotClick(dayIdx: number, timeIdx: number) {
    setTaskSelected(null);
    setAddModalInfo({ dayIdx, timeIdx });
    setIsTaskDialogOpened(true);
  }

  // Open edit modal for a task
  function handleTaskClick(task: Task) {
    setTaskSelected(task);
    setIsTaskDialogOpened(true);
  }

  // Pre-fill logic for add modal (handled in TasksDialog via taskSelected=null and default values)
  React.useEffect(() => {
    if (addModalInfo) {
      // Optionally, could pass context via Zustand or context provider if needed
    }
  }, [addModalInfo]);

  // Reset addModalInfo when modal closes
  React.useEffect(() => {
    if (!isTaskDialogOpened) {
      setAddModalInfo(null);
    }
  }, [isTaskDialogOpened]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: COLORS.background, color: COLORS.primaryText, fontFamily: 'Inter, sans-serif' }}>
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-8 md:px-12 py-4 sm:py-0" style={{ height: 'auto', background: COLORS.surface, boxShadow: '0 2px 8px rgba(0,0,0,0.3)', borderBottom: `1px solid ${COLORS.border}` }}>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2 sm:mb-0" style={{ color: COLORS.primaryText }}>{`Week of ${weekRange}`}</h1>
        <TasksDialog
          defaultDate={!taskSelected && addModalInfo ? getSlotDateTime(addModalInfo.dayIdx, addModalInfo.timeIdx).dateStr : undefined}
          defaultTime={!taskSelected && addModalInfo ? getSlotDateTime(addModalInfo.dayIdx, addModalInfo.timeIdx).timeStr : undefined}
        />
      </header>
      <main className="flex-1 flex flex-col items-stretch p-0 overflow-x-auto">
        <div className="w-full max-w-full mx-auto flex-1 flex flex-col px-2 sm:px-4 md:px-8" style={{ background: COLORS.surface, borderRadius: '16px', margin: '16px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>
          {/* Calendar grid */}
          <div className="flex border-b text-xs sm:text-base" style={{ borderColor: COLORS.border }}>
            <div style={{ width: 40, minWidth: 40 }}></div>
            {DAYS.map(day => (
              <div key={day} className="flex-1 py-2 sm:py-3 text-center font-medium" style={{ color: COLORS.secondaryText }}>{day}</div>
            ))}
          </div>
          <div className="flex-1 flex overflow-x-auto" style={{ minHeight: 0 }}>
            {/* Time column */}
            <div className="flex flex-col" style={{ width: 40, minWidth: 40 }}>
              {TIMES.map(time => (
                <div key={time} className="h-12 sm:h-16 flex items-start justify-end pr-1 sm:pr-2 text-[10px] sm:text-xs" style={{ color: COLORS.secondaryText, borderBottom: `1px solid ${COLORS.border}` }}>{time}</div>
              ))}
            </div>
            {/* Days columns */}
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="flex-1 min-w-[80px] sm:min-w-0 flex flex-col border-l" style={{ borderColor: COLORS.border }}>
                {TIMES.map((time, timeIdx) => {
                  const slotTasks = getSlotTasks(dayIdx, timeIdx);
                  const maxVisible = 2;
                  const showMore = slotTasks.length > maxVisible;
                  const slotDate = getSlotDateTime(dayIdx, timeIdx).dateStr;
                  const slotTime = getSlotDateTime(dayIdx, timeIdx).timeStr;
                  return (
                    <div
                      key={time}
                      className="h-12 sm:h-16 border-b group relative cursor-pointer transition hover:bg-[#252525]"
                      style={{ borderColor: COLORS.border }}
                      onClick={() => handleSlotClick(dayIdx, timeIdx)}
                    >
                      {/* Render up to 2 tasks in this slot */}
                      {slotTasks.slice(0, maxVisible).map((task, idx) => (
                        <div
                          key={task.id}
                          className="absolute left-1 right-1 sm:left-2 sm:right-2" style={{ top: `${1 + idx * 18}px` }}
                        >
                          <div
                            className="h-8 sm:h-10 rounded-xl shadow-card px-2 sm:px-3 py-1 sm:py-2 flex items-center gap-2 z-10 hover:scale-105 hover:shadow-lg transition bg-blue-600 text-white"
                            style={{
                              background: COLORS.accentBlue,
                              color: '#fff',
                              boxShadow: '0 2px 8px rgba(59,130,246,0.15)',
                              cursor: 'pointer',
                            }}
                            title={task.name}
                            onClick={e => {
                              e.stopPropagation();
                              handleTaskClick(task);
                            }}
                          >
                            <span className="truncate font-semibold text-xs sm:text-sm">{task.name}</span>
                            <span className="ml-auto text-[10px] sm:text-xs opacity-80">{task.priority}</span>
                          </div>
                        </div>
                      ))}
                      {showMore && (
                        <button
                          className="absolute left-1 sm:left-2 bottom-1 text-[10px] sm:text-xs text-blue-400 underline bg-transparent p-0 m-0"
                          style={{ zIndex: 20 }}
                          onClick={e => { e.stopPropagation(); setViewTasksSlot({ dayIdx, timeIdx }); }}
                          aria-label={`Show all tasks for ${slotDate} ${slotTime}`}
                        >
                          +{slotTasks.length - maxVisible} more
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </main>
      {/* View all tasks for a slot modal */}
      <DayTaskModal
        open={!!viewTasksSlot}
        onOpenChange={open => setViewTasksSlot(open ? viewTasksSlot : null)}
        date={viewTasksSlot ? getSlotDateTime(viewTasksSlot.dayIdx, viewTasksSlot.timeIdx).dateStr : null}
        slotTime={viewTasksSlot ? getSlotDateTime(viewTasksSlot.dayIdx, viewTasksSlot.timeIdx).timeStr : undefined}
        tasks={tasks}
        addMode
      />
    </div>
  );
} 