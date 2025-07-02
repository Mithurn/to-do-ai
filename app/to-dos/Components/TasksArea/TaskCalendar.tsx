'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '@/app/data/Tasks'; // adjust if needed
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasksStore } from '@/app/stores/useTasksStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { motion, AnimatePresence } from 'framer-motion';
import { DayTaskModal } from './DayTaskModal';

function exportTasksCSV(tasks: Task[]) {
  if (!tasks.length) return;
  const header = ['Name', 'Priority', 'Status', 'Start Time', 'End Time'];
  const csvRows = [header.join(',')];
  for (const t of tasks) {
    csvRows.push([
      t.name,
      t.priority,
      t.status,
      t.startTime || '',
      t.endTime || ''
    ].map(field => JSON.stringify(field ?? '')).join(','));
  }
  const csv = csvRows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'tasks.csv';
  a.click();
  window.URL.revokeObjectURL(url);
}

function exportTasksPDF(tasks: Task[]) {
  if (!tasks.length) return;
  const doc = new jsPDF();
  doc.text('Tasks', 14, 16);
  autoTable(doc, {
    head: [['Name', 'Priority', 'Status', 'Start Time', 'End Time']],
    body: tasks.map(t => [t.name, t.priority, t.status, t.startTime || '', t.endTime || '']),
    startY: 22,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [59, 130, 246] },
  });
  doc.save('tasks.pdf');
}

export default function TaskCalendar({ tasks }: { tasks: Task[] }) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<any>(null);
  const { setIsTaskDialogOpened, setTaskSelected, isLoading } = useTasksStore();
  const [calendarView, setCalendarView] = useState('timeGridWeek');

  // Click-away handler
  useEffect(() => {
    if (!showExportMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showExportMenu]);

  const events: Array<{
    id: string;
    title: string;
    start: string | undefined;
    end: string | undefined;
    color: string;
    extendedProps?: Record<string, any>;
  }> = tasks
    .filter((task) => task.startTime && task.endTime)
    .map((task, idx, arr) => {
      const day = task.startTime!.slice(0, 10);
      // Find the first event for this day
      const isFirstForDay =
        arr.findIndex(e => e.startTime && e.startTime.slice(0, 10) === day) === idx;
      return {
        id: task.id,
        title: task.name,
        start: task.startTime,
        end: task.endTime,
        color:
          task.status === 'completed'
            ? '#16a34a'
            : task.priority === 'high'
            ? '#ef4444'
            : task.priority === 'medium'
            ? '#f59e0b'
            : '#3b82f6',
        extendedProps: { isFirstForDay },
      };
    });

  // Custom navigation for FullCalendar
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };
  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  // Empty state illustration SVG
  const EmptyCalendarSVG = () => (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="mx-auto mb-4">
      <rect x="20" y="30" width="120" height="70" rx="12" fill="hsl(var(--card))" stroke="hsl(var(--border))" strokeWidth="2" />
      <rect x="35" y="50" width="90" height="10" rx="5" fill="hsl(var(--muted))" />
      <rect x="35" y="65" width="60" height="10" rx="5" fill="hsl(var(--muted))" />
      <rect x="35" y="80" width="40" height="10" rx="5" fill="hsl(var(--muted))" />
      <circle cx="50" cy="40" r="4" fill="hsl(var(--primary))" />
      <circle cx="65" cy="40" r="4" fill="hsl(var(--accent))" />
      <circle cx="80" cy="40" r="4" fill="hsl(var(--destructive))" />
    </svg>
  );

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background text-foreground rounded-xl shadow-card p-8 md:p-12 border border-border flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-muted animate-pulse rounded-xl h-32 w-full shadow-card" />
          ))}
        </div>
        <div className="text-base text-muted-foreground mt-8">Loading your calendar...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-background text-foreground rounded-xl shadow-card p-8 md:p-12 border border-border flex flex-col items-center justify-center min-h-[500px]">
        <EmptyCalendarSVG />
        <div className="text-xl font-semibold text-muted-foreground mb-2">No tasks scheduled</div>
        <div className="text-base text-muted-foreground mb-4 text-center">You have no tasks on your calendar yet.<br />Click "New Task" to get started!</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full p-6 bg-background text-foreground overflow-y-auto rounded-xl">
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button
            className="bg-primary text-primary-foreground rounded-lg shadow-sm px-4 py-2 text-sm font-medium transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div
              ref={menuRef}
              className="absolute right-4 top-12 z-50 bg-card text-foreground shadow-card rounded-xl px-4 py-2 border border-border"
            >
              <button
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-muted/70 hover:text-foreground text-sm transition-all duration-300 ease-in-out text-muted-foreground"
                onClick={() => { exportTasksPDF(tasks); setShowExportMenu(false); }}
              >
                Export as PDF
              </button>
              <button
                className="block w-full text-left px-4 py-2 rounded-lg hover:bg-muted/70 hover:text-foreground text-sm transition-all duration-300 ease-in-out text-muted-foreground"
                onClick={() => { exportTasksCSV(tasks); setShowExportMenu(false); }}
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="w-full relative">
        {/* Custom sticky navigation */}
        <div className="sticky top-0 z-20 flex items-center gap-4 bg-card py-2 mb-4 rounded-xl overflow-x-auto min-w-[320px] scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          <button
            onClick={handlePrev}
            className="bg-card rounded-lg shadow-sm px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-300 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition" />
          </button>
          <button
            onClick={() => calendarRef.current?.getApi().today()}
            className="bg-primary text-primary-foreground rounded-lg shadow-card px-4 py-1.5 text-sm font-semibold transition-all duration-300 ease-in-out hover:bg-primary/90 hover:shadow-md hover:scale-[1.01] active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 mx-2"
          >
            Today
          </button>
          <button
            onClick={handleNext}
            className="bg-card rounded-lg shadow-sm px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground transition-all duration-300 ease-in-out transform hover:scale-[1.01] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition" />
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <FullCalendar
              ref={calendarRef}
              plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              allDaySlot={false}
              editable={false}
              selectable={false}
              height="auto"
              nowIndicator
              events={events.map(ev => {
                const base = { ...ev, extendedProps: { ...(ev.extendedProps ?? {}) } };
                if (!base.start) return { ...base, extendedProps: { ...base.extendedProps, isFirstForDay: false, isFirstForSlot: false } };
                const day = base.start.slice(0, 10);
                const slot = base.start.slice(0, 16);
                const isFirstForDay =
                  events.findIndex(e => e.start && e.start.slice(0, 10) === day && e.id === base.id) ===
                  events.findIndex(e => e.start && e.start.slice(0, 10) === day);
                const isFirstForSlot =
                  events.findIndex(e => e.start && e.start.slice(0, 16) === slot && e.id === base.id) ===
                  events.findIndex(e => e.start && e.start.slice(0, 16) === slot);
                return { ...base, extendedProps: { ...base.extendedProps, isFirstForDay, isFirstForSlot } };
              })}
              headerToolbar={{
                left: '',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              slotMinTime="06:00:00"
              slotMaxTime="22:00:00"
              eventMaxStack={3}
              slotEventOverlap={false}
              dayMaxEvents={2}
              dayMaxEventRows={3}
              moreLinkClick="popover"
              eventClassNames={() => 'rounded-lg bg-muted px-2 py-1 text-sm text-muted-foreground truncate shadow-sm hover:shadow-md transition-shadow duration-300 transition-all duration-300 ease-in-out hover:bg-muted/70 hover:scale-[1.01] cursor-pointer'}
              eventContent={(arg) => {
                // Show up to 2 tasks, then '+N more' if more
                const day = arg.event.startStr.slice(0, 10);
                const allEventsForDay = arg.view.getCurrentData().eventStore.instances
                  ? Object.values(arg.view.getCurrentData().eventStore.instances).filter(e => e.range.start.toISOString().slice(0, 10) === day)
                    : [];
                const idx = allEventsForDay.findIndex(e => e.defId === arg.event._def.defId);
                if (idx < 2) {
                  // Show the first two tasks
                  return (
                    <div className="truncate w-full flex items-center gap-2">
                      <span className="truncate rounded-lg bg-muted px-2 py-1 text-sm text-muted-foreground shadow-sm hover:shadow-md transition-shadow duration-300 transition-all duration-300 ease-in-out hover:bg-muted/70 hover:scale-[1.01] cursor-pointer line-clamp-2">{arg.event.title}</span>
                    </div>
                  );
                } else if (idx === 2) {
                  // Show '+N more' badge
                    return (
                      <div
                      className="text-sm text-primary cursor-pointer hover:underline px-2 py-1 rounded-lg bg-card shadow-card transition-all duration-300 ease-in-out hover:scale-[1.01]"
                        onClick={() => {
                          setModalDate(day);
                          setShowDayModal(true);
                        }}
                      >
                      +{allEventsForDay.length - 2} more
                      </div>
                    );
                } else {
                  // Don't render anything for other events
                    return null;
                  }
              }}
              dateClick={(info) => {
                // Open DayTaskModal in add mode, prefill date
                setModalDate(info.dateStr);
                setShowDayModal(true);
              }}
              eventClick={(info) => {
                // Open Task Editor with clicked task data
                const taskId = info.event.id;
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                  setTaskSelected(task);
                  setIsTaskDialogOpened(true);
                }
              }}
              viewDidMount={(info) => {
                setCalendarView(info.view.type);
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      {/* Modal for all tasks on a day */}
      <DayTaskModal
        open={showDayModal}
        onOpenChange={setShowDayModal}
        date={modalDate}
        tasks={tasks}
        addMode={true}
      />
      <style>{`
        .fc {
          background: transparent;
        }
        .fc .fc-toolbar-title {
          font-size: 1.125rem;
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .fc .fc-button {
          background: hsl(var(--card));
          color: hsl(var(--muted-foreground));
          border-radius: 0.75rem;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          padding: 0.375rem 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          transition: background 0.2s, color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .fc .fc-button:hover, .fc .fc-button:focus {
          background: hsl(var(--muted));
          color: hsl(var(--foreground));
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transform: scale(1.05);
        }
        .fc .fc-button.fc-button-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .fc .fc-col-header-cell {
          background: hsl(var(--background));
          color: hsl(var(--muted-foreground));
          font-size: 0.95rem;
          font-weight: 500;
          border-bottom: 1px solid hsl(var(--border));
          padding: 0.5rem 0.5rem;
        }
        .fc .fc-daygrid-day, .fc .fc-timegrid-col {
          background: hsl(var(--card));
          color: hsl(var(--foreground));
          border: none;
          border-radius: 0.75rem;
          margin: 4px;
          padding: 1rem 0.5rem 0.5rem 0.5rem;
          box-shadow: 0 1px 4px 0 rgba(16,30,54,0.04);
          transition: background 0.2s, box-shadow 0.2s;
        }
        .fc .fc-daygrid-day {
          gap: 0.75rem;
        }
        .fc .fc-day-today, .fc .fc-daygrid-day.fc-day-today, .fc .fc-timegrid-col.fc-day-today {
          background: hsl(var(--primary) / 0.10);
          border: 2px solid hsl(var(--primary) / 0.3);
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        .fc .fc-daygrid-day:hover, .fc .fc-timegrid-col:hover {
          background: hsl(var(--muted));
          box-shadow: 0 2px 8px rgba(16,30,54,0.08);
        }
        .fc .fc-event {
          border-radius: 0.75rem;
          font-size: 0.95rem;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0,0,0,0.03);
          margin-bottom: 0.5rem;
          transition: filter 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .fc .fc-event:hover {
          filter: brightness(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          transform: scale(1.01);
        }
        .fc .fc-daygrid-day-frame {
          min-height: 90px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .fc .fc-daygrid-day-events {
          flex: 1 1 auto;
          overflow-y: auto;
          scrollbar-width: thin;
        }
        .fc .fc-daygrid-day-bottom {
          margin-top: 0.5rem;
        }
        .fc .fc-daygrid-day.fc-day-other {
          opacity: 0.5;
        }
        .fc .fc-daygrid-day-number {
          font-size: 1rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary));
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          box-shadow: 0 2px 8px rgba(59,130,246,0.08);
        }
        .fc .fc-daygrid-day.fc-day-today {
          z-index: 1;
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          border-radius: 1rem;
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          border: 2px solid hsl(var(--primary) / 0.3);
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-frame {
          background: hsl(var(--primary) / 0.10);
        }
        .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          font-weight: 700;
        }
        .fc .fc-daygrid-day .fc-daygrid-day-events:empty::after {
          content: 'No tasks';
          display: block;
          color: hsl(var(--muted-foreground));
          font-size: 0.95rem;
          font-style: italic;
          text-align: center;
          margin-top: 1.5rem;
        }
        .fc-popover,
        .fc-more-popover,
        .fc-popover-header,
        .fc-popover-body {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
        }
        .fc-popover,
        .fc-more-popover {
          border-radius: 1rem !important;
          box-shadow: 0 8px 32px 0 rgba(16, 30, 54, 0.12), 0 1.5px 4px 0 rgba(16, 30, 54, 0.08) !important;
          border: none !important;
          padding: 1rem !important;
        }
        .fc-popover-header {
          border: none !important;
        }
        .fc-popover-body {
        }
        .fc-more-popover .fc-popover-body {
          padding: 0.5rem 0;
        }
        .fc-popover-title {
          font-size: 1rem;
          font-weight: 600;
        }
        .fc-popover-close {
          border: none;
          background: none;
          color: hsl(var(--muted-foreground));
        }
        .fc-popover-close:focus {
          outline: 2px solid hsl(var(--ring));
        }
        /* Custom scrollbar fallback for calendar container and sticky nav */
        .scrollbar-thin::-webkit-scrollbar {
          height: 8px;
          width: 8px;
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: hsl(var(--muted));
          border-radius: 8px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
      `}</style>
      {/* Mobile hint */}
      <div className="block sm:hidden text-xs text-muted-foreground text-center mt-2 mb-4">Tip: Swipe left/right to scroll the calendar and use the Today button for quick navigation.</div>
    </div>
  );
}

// Export helpers for dashboard
export { exportTasksCSV, exportTasksPDF };

// Custom event content for consistent text color
function renderEventContent(eventInfo: any) {
  return (
    <div className="flex flex-col space-y-1">
      <span className="text-xs text-muted-foreground">{eventInfo.timeText}</span>
      <span className="text-sm font-medium text-primary-foreground">{eventInfo.event.title}</span>
    </div>
  );
}
