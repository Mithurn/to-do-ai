'use client';

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Task } from '@/app/data/Tasks'; // adjust if needed

export default function TaskCalendar({ tasks }: { tasks: Task[] }) {
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
