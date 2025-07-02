'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '@/app/data/Tasks';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTasksStore } from '@/app/stores/useTasksStore';
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

  const events = tasks.filter(t => t.startTime && t.endTime).map(t => ({
    id: t.id,
    title: t.name,
    start: t.startTime,
    end: t.endTime,
    color: t.status === 'completed' ? '#16a34a' : t.priority === 'high' ? '#ef4444' : t.priority === 'medium' ? '#f59e0b' : '#3b82f6'
  }));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button onClick={() => setShowExportMenu(prev => !prev)} className="bg-blue-500 text-white px-4 py-2 rounded-md shadow hover:bg-blue-600">
            Export ▼
          </button>
          {showExportMenu && (
            <div ref={menuRef} className="absolute right-0 mt-2 w-40 bg-white border rounded shadow">
              <button onClick={() => { exportTasksPDF(tasks); setShowExportMenu(false); }} className="block w-full px-4 py-2 text-left hover:bg-gray-100">Export as PDF</button>
              <button onClick={() => { exportTasksCSV(tasks); setShowExportMenu(false); }} className="block w-full px-4 py-2 text-left hover:bg-gray-100">Export as CSV</button>
            </div>
          )}
        </div>
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        allDaySlot={false}
        editable={false}
        selectable={false}
        height="auto"
        nowIndicator
        events={events}
        headerToolbar={{ left: '', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        eventClick={(info) => {
          const taskId = info.event.id;
          const task = tasks.find(t => t.id === taskId);
          if (task) {
            setTaskSelected(task);
            setIsTaskDialogOpened(true);
          }
        }}
        eventContent={(arg) => {
          const day = arg.event.startStr.slice(0, 10);
          const allEventsForDay = arg.view.calendar.getEvents().filter((e) => e.start?.toISOString().slice(0, 10) === day);
          const idx = allEventsForDay.findIndex((e) => e.id === arg.event.id);

          if (idx < 2) {
            return (
              <div className="truncate w-full flex items-center gap-2">
                <span className="truncate rounded-lg bg-muted px-2 py-1 text-sm text-muted-foreground shadow-sm hover:shadow-md transition-all duration-300 ease-in-out hover:bg-muted/70 hover:scale-[1.01] cursor-pointer line-clamp-2">
                  {arg.event.title}
                </span>
              </div>
            );
          } else if (idx === 2) {
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
            return null;
          }
        }}
        dateClick={(info) => {
          setModalDate(info.dateStr);
          setShowDayModal(true);
        }}
      />

      <DayTaskModal
        open={showDayModal}
        onOpenChange={setShowDayModal}
        date={modalDate}
        tasks={tasks}
        addMode={true}
      />
    </div>
  );
}

export { exportTasksCSV, exportTasksPDF };
