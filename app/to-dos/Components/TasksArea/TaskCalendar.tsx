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

  const events = tasks.filter(task => task.startTime && task.endTime).map(task => ({
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

  if (isLoading) return <div className="text-center p-8">Loading calendar...</div>;
  if (!tasks.length) return <div className="text-center p-8">No tasks scheduled.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-end mb-4 relative">
        <button
          className="bg-primary text-white px-4 py-2 rounded"
          onClick={() => setShowExportMenu(v => !v)}
        >
          Export ▼
        </button>
        {showExportMenu && (
          <div
            ref={menuRef}
            className="absolute top-full right-0 bg-white border mt-2 rounded shadow-lg z-10"
          >
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { exportTasksPDF(tasks); setShowExportMenu(false); }}>Export as PDF</button>
            <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => { exportTasksCSV(tasks); setShowExportMenu(false); }}>Export as CSV</button>
          </div>
        )}
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        height="auto"
        allDaySlot={false}
        events={events}
        headerToolbar={{ left: '', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        nowIndicator
        eventClick={(info) => {
          const task = tasks.find(t => t.id === info.event.id);
          if (task) {
            setTaskSelected(task);
            setIsTaskDialogOpened(true);
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