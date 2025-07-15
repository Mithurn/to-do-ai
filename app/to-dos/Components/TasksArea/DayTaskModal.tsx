'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/app/data/Tasks';
import { Button } from '@/components/ui/button';

export type DayTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  tasks: Task[];
  addMode?: boolean;
  slotTime?: string; // for weekly view
};

export const DayTaskModal: React.FC<DayTaskModalProps> = ({
  open,
  onOpenChange,
  date,
  tasks,
  addMode = false,
  slotTime,
}) => {
  // Filter by date (YYYY-MM-DD) and optionally by slotTime (HH:mm)
  const filteredTasks = tasks.filter((task) => {
    if (!date || !task.startTime) return false;
    const taskDate = task.startTime.slice(0, 10);
    if (slotTime) {
      const taskTime = task.startTime.slice(11, 16);
      return taskDate === date && taskTime === slotTime;
    }
    return taskDate === date;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {addMode ? `Tasks for ${date}${slotTime ? ' ' + slotTime : ''}` : `Edit Task on ${date}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {filteredTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks scheduled for this {slotTime ? 'slot' : 'day'}.</p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-muted/50 border border-border shadow-sm"
              >
                <div className="text-base font-semibold mb-1">{task.name}</div>
                {task.description && (
                  <div className="text-sm text-muted-foreground mb-1">{task.description}</div>
                )}
                <div className="text-xs text-muted-foreground mb-1">
                  {task.startTime ? `Start: ${new Date(task.startTime).toLocaleString()}` : ''}
                  {task.endTime ? ` | End: ${new Date(task.endTime).toLocaleString()}` : ''}
                </div>
                <div className="text-xs mt-1">
                  Priority: {task.priority} | Status: {task.status}
                </div>
              </div>
            ))
          )}
        </div>
        <Button className="mt-6 w-full" variant="outline" onClick={() => onOpenChange(false)} aria-label="Close task details modal">
          Close
        </Button>
      </DialogContent>
    </Dialog>
  );
};
