'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Task } from '@/app/data/Tasks';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  tasks: Task[];
  addMode?: boolean;
};

export const DayTaskModal: React.FC<Props> = ({ open, onOpenChange, date, tasks, addMode = false }) => {
  const filteredTasks = date
    ? tasks.filter(task => task.startTime?.startsWith(date))
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Tasks for {date ?? 'Selected Day'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You have {filteredTasks.length} task{filteredTasks.length !== 1 && 's'} scheduled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[300px] overflow-y-auto mt-2">
          {filteredTasks.length === 0 ? (
            <div className="text-muted-foreground text-sm">No tasks on this day.</div>
          ) : (
            filteredTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 border rounded-lg shadow-sm bg-muted text-muted-foreground hover:bg-muted/80 transition-all"
              >
                <div className="font-medium text-foreground">{task.name}</div>
                <div className="text-xs">
                  <span className="capitalize">{task.priority}</span> |{' '}
                  <span className="capitalize">{task.status}</span>
                </div>
                <div className="text-xs mt-1">
                  {task.startTime} → {task.endTime}
                </div>
              </div>
            ))
          )}
        </div>

        {addMode && (
          <div className="mt-4 text-sm text-center text-blue-600 hover:underline cursor-pointer">
            {/* Replace this with your actual task creation logic */}
            + Add New Task (not implemented)
          </div>
        )}

        <DialogClose asChild>
          <button className="mt-6 w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition">
            Close
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};
