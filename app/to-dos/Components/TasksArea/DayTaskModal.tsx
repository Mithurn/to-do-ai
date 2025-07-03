'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Task } from '@/app/data/Tasks';

type DayTaskModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  tasks: Task[];
  addMode?: boolean;
};

export const DayTaskModal: React.FC<DayTaskModalProps> = ({
  open,
  onOpenChange,
  date,
  tasks,
  addMode = false,
}) => {
  const filteredTasks = tasks.filter((task) => task.startTime?.startsWith(date ?? ''));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {addMode ? `Tasks for ${date}` : `Edit Task on ${date}`}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 mt-4">
          {filteredTasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks scheduled for this day.</p>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-lg bg-muted/50 border border-border shadow-sm"
              >
                <div className="text-sm font-semibold">{task.name}</div>
                <div className="text-xs text-muted-foreground">
                  {task.startTime} → {task.endTime}
                </div>
                <div className="text-xs mt-1">
                  Priority: {task.priority} | Status: {task.status}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
