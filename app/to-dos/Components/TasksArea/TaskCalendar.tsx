'use client';

import React, { useState, useRef, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '@/app/data/Tasks'; // adjust if needed
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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

  return (
    <div className="mt-6 w-full max-w-5xl mx-auto">
      <div className="flex justify-end mb-4">
        <div className="relative">
          <button
            className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm font-medium"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-10"
            >
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => { exportTasksPDF(tasks); setShowExportMenu(false); }}
              >
                Export as PDF
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                onClick={() => { exportTasksCSV(tasks); setShowExportMenu(false); }}
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        allDaySlot={false}
        editable={false}
        selectable={false}
        height="auto"
        nowIndicator
        events={events}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay',
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
      />
    </div>
  );
}

// Export helpers for dashboard
export { exportTasksCSV, exportTasksPDF };
