"use client";

import { Button } from "@/components/ui/button";
import { FormProvider, useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { TaskForm } from "./TaskForm";
import { FaPlus } from "react-icons/fa";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
import { useTasksStore } from "@/app/stores/useTasksStore";
import { nanoid } from "nanoid";
import { Task } from "@/app/data/Tasks";
import { toast } from "@/hooks/use-toast";
import { useUserStore } from "@/app/stores/useUserStore";

const taskFormSchema = z.object({
  taskName: z.string().min(3, { message: "Task name must be at least 3 characters" }),
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["in progress", "completed"]),
  taskDate: z.string().min(1, "Start date is required"),
  taskTime: z.string().min(1, "Start time is required"),
  endDate: z.string().optional(),
  endTime: z.string().optional(),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export function TasksDialog() {
  const methods = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
  });

  const {
    addNewTask,
    updateTaskFunction,
    isLoading,
    isTaskDialogOpened,
    setIsTaskDialogOpened,
    taskSelected,
    setTaskSelected,
    fetchTasks,
  } = useTasksStore();

  const { user } = useUserStore();

  async function onSubmit(data: TaskFormValues) {
    try {
      const startStr = `${data.taskDate}T${data.taskTime}`;
      const safeStartStr = startStr.length === 16 ? `${startStr}:00` : startStr;
      const start = new Date(safeStartStr);

      if (isNaN(start.getTime())) {
        toast({
          variant: "destructive",
          title: "Invalid Date or Time",
          description: "Make sure the start time is valid.",
        });
        return;
      }

      let endTime: string | undefined;
      if (data.endDate && data.endTime) {
        const endStr = `${data.endDate}T${data.endTime}`;
        const safeEndStr = endStr.length === 16 ? `${endStr}:00` : endStr;
        const end = new Date(safeEndStr);

        if (isNaN(end.getTime())) {
      toast({
            variant: "destructive",
            title: "Invalid End Date or Time",
            description: "Make sure the end time is valid.",
      });
          return;
        }

        if (end <= start) {
          toast({
            variant: "destructive",
            title: "Invalid Time Range",
            description: "End time must be after start time.",
          });
          return;
        }

        endTime = end.toISOString();
      }

      const task: Task = {
        id: taskSelected?.id || nanoid(),
        name: data.taskName,
        priority: data.priority,
        status: data.status,
        userId: user?.id || "",
        startTime: start.toISOString(),
        endTime,
      };

      const result = taskSelected
        ? await updateTaskFunction(task)
        : await addNewTask(task);

      toast({
        variant: result.success ? "default" : "destructive",
        title: result.success ? "Success" : "Error",
        description: result.success
          ? `The task "${task.name}" was successfully ${taskSelected ? "updated" : "added"}.`
          : "There was a problem saving the task.",
      });

      if (result.success) {
        await fetchTasks(user);
        setTaskSelected(null);
        setIsTaskDialogOpened(false);
      }
    } catch (err: any) {
        toast({
          variant: "destructive",
        title: "Unexpected Error",
        description: err.message || "An unexpected error occurred.",
        });
    }
  }

  function handleDialogStateChange(isOpen: boolean) {
    setIsTaskDialogOpened(isOpen);
    if (!isOpen) {
      methods.reset();
      setTaskSelected(null);
    }
  }

  useEffect(() => {
    if (isTaskDialogOpened) {
      if (taskSelected) {
        methods.setValue("taskName", taskSelected.name);
        methods.setValue("priority", taskSelected.priority);
        methods.setValue("status", taskSelected.status);
        methods.trigger(["priority", "status"]);
        
        // Set date/time for editing existing task
        if (taskSelected.startTime) {
          const startDate = new Date(taskSelected.startTime);
          methods.setValue("taskDate", startDate.toISOString().split('T')[0]);
          methods.setValue("taskTime", startDate.toTimeString().slice(0, 5));
        }
      } else {
        // Set default values for new task
        const now = new Date();
        methods.setValue("taskDate", now.toISOString().split('T')[0]);
        methods.setValue("taskTime", now.toTimeString().slice(0, 5));
        methods.setValue("priority", "low");
        methods.setValue("status", "in progress");
        methods.trigger(["taskDate", "taskTime", "priority", "status"]);
      }
    }
  }, [isTaskDialogOpened, taskSelected, methods]);

  return (
    <Dialog open={isTaskDialogOpened} onOpenChange={handleDialogStateChange}>
      <DialogTrigger asChild>
  <Button className="flex items-center gap-1 px-2 py-1.5 text-sm rounded-md min-w-0 w-auto transition-[box-shadow,transform] duration-200 hover:scale-105 active:scale-95 hover:shadow-md">
    <FaPlus />
    <span>New Task</span>
  </Button>
</DialogTrigger>


      <FormProvider {...methods}>
        <DialogContent className="p-7 poppins">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {taskSelected ? "Edit Task" : "Add Task"}
            </DialogTitle>
            <DialogDescription>
              Add a new task here. Click save when you're done.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={methods.handleSubmit(onSubmit)}>
            <TaskForm />
            <DialogFooter className="mt-11">
              <Button type="submit" className="flex items-center gap-1">
                {isLoading ? "Loading..." : "Save task"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </FormProvider>
    </Dialog>
  );
}
