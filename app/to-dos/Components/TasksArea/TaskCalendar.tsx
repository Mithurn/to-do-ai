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
  const menuRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<any>(null);

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

  const events = tasks
    .filter((task) => task.startTime && task.endTime)
    .map((task) => ({
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
    }));

  // Custom navigation for FullCalendar
  const handlePrev = () => {
    calendarRef.current?.getApi().prev();
  };
  const handleNext = () => {
    calendarRef.current?.getApi().next();
  };

  return (
    <div className="mt-6 w-full max-w-4xl mx-auto p-4 bg-white dark:bg-[#1a1a1a] rounded-xl shadow-md text-gray-800 dark:text-gray-100">
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm font-medium hidden sm:block transition-colors duration-200"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div
              ref={menuRef}
              className="absolute right-4 top-12 z-50 bg-white dark:bg-gray-900 shadow-lg rounded-md p-4 border border-red-500"
            >
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors duration-200 text-gray-700 dark:text-gray-300"
                onClick={() => { exportTasksPDF(tasks); setShowExportMenu(false); }}
              >
                Export as PDF
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors duration-200 text-gray-700 dark:text-gray-300"
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
        <div className="sticky top-0 z-20 flex justify-between items-center bg-white dark:bg-[#1a1a1a] py-2 mb-2">
          <button
            onClick={handlePrev}
            className="rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition"
            aria-label="Previous Month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            className="rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 p-1 transition"
            aria-label="Next Month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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
          headerToolbar={{
            left: '',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          eventClassNames={({ isSelected }) =>
            [
              'rounded-md transition-colors duration-200',
              'hover:bg-gray-100 dark:hover:bg-gray-700',
              isSelected ? 'bg-blue-500 text-white dark:bg-blue-600' : '',
            ].join(' ')
          }
          eventContent={renderEventContent}
        />
      </div>
      {/* Custom calendar day cell styles for hover, selected, and today */}
      <style>{`
        .fc-daygrid-day, .fc-timegrid-col {
          transition: background-color 0.2s;
        }
        .dark .fc-daygrid-day:hover, .dark .fc-timegrid-col:hover {
          background-color: #374151 !important; /* dark:hover:bg-gray-700 */
        }
        .fc-daygrid-day:hover, .fc-timegrid-col:hover {
          background-color: #f3f4f6 !important; /* hover:bg-gray-100 */
        }
        .fc-daygrid-day.fc-day-today, .fc-timegrid-col.fc-day-today {
          border: 2px solid #3b82f6 !important; /* border-blue-500 */
          border-radius: 9999px !important; /* rounded-full */
        }
        .fc-daygrid-day.fc-day-selected, .fc-timegrid-col.fc-day-selected {
          background-color: #2563eb !important; /* bg-blue-600 */
          color: #fff !important; /* text-white */
          font-weight: 600 !important; /* font-semibold */
        }
        .dark .fc-daygrid-day.fc-day-selected, .dark .fc-timegrid-col.fc-day-selected {
          background-color: #2563eb !important; /* dark:bg-blue-600 */
          color: #fff !important;
        }
        .fc .fc-button-group .fc-prev-button,
        .fc .fc-button-group .fc-next-button {
          display: none !important;
        }
        .fc .fc-daygrid-body {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 8px;
        }
        @media (min-width: 640px) {
          .fc .fc-daygrid-body {
            gap: 16px;
          }
        }
        .fc .fc-daygrid-day {
          padding: 12px;
        }
        @media (min-width: 640px) {
          .fc .fc-daygrid-day {
            padding: 16px;
          }
        }
        .fc .fc-daygrid-day-number {
          font-size: 1rem;
        }
        @media (min-width: 640px) {
          .fc .fc-daygrid-day-number {
            font-size: 1.125rem;
          }
        }
        .fc .fc-daygrid-day-frame {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
      `}</style>
    </div>
  );
}

// Export helpers for dashboard
export { exportTasksCSV, exportTasksPDF };

// Custom event content for consistent text color
function renderEventContent(eventInfo: any) {
  return (
    <div className="px-2 py-1 text-sm text-gray-900 dark:text-gray-100">
      <b className="text-gray-700 dark:text-gray-300">{eventInfo.timeText}</b>{' '}
      <span className="text-gray-900 dark:text-gray-100">{eventInfo.event.title}</span>
    </div>
  );
}
