import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComboboxDemo } from "./PriorityCombobox";
import { TasksOptions } from "./TasksOptions";
import { useTasksStore } from "@/app/stores/useTasksStore";
import { Task } from "@/app/data/Tasks";
import { useEffect, useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import CircularProgress from "@mui/material/CircularProgress";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { useUserStore } from "@/app/stores/useUserStore";
import { exportTasksCSV, exportTasksPDF } from './TaskCalendar';
import { DeleteDialog } from '../Dialogs/ClearAllDialog/DeleteDialog';
import { TasksDialog } from '../Dialogs/TaskDialog/TaskDialog';
import { motion } from "framer-motion";
import { HiDotsVertical } from "react-icons/hi";

export function TasksArea({ searchQuery = '', filterPriority = 'all', filterStatus = 'all', setShowAiInput }: { searchQuery?: string, filterPriority?: string, filterStatus?: string, setShowAiInput?: (open: boolean) => void }) {
  const { tasks, fetchTasks, isLoading } = useTasksStore();
  const { user } = useUserStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getTasksData(user);
  }, [user]);

  async function getTasksData(user: { id: string; email: string } | null) {
    await fetchTasks(user);
  }

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesQuery = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesQuery && matchesPriority && matchesStatus;
  });

  // Click-away handler for export menu
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

  // Always show the New Task button at the top
  const renderHeader = (
    <div className="flex items-center justify-between mb-6 flex-wrap gap-4 transition-colors duration-300 antialiased">
      <h2 className="text-3xl font-bold tracking-tight text-foreground">Your Tasks</h2>
      <div className="flex items-center gap-3">
        <TasksDialog />
        <div className="relative">
          <button
            className="bg-secondary text-secondary-foreground px-4 py-2 rounded-xl shadow-card transition-all duration-200 font-semibold text-base hover:bg-muted hover:shadow-card-hover hover:scale-[1.03] active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => setShowExportMenu((v) => !v)}
          >
            Export ▼
          </button>
          {showExportMenu && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-44 bg-card border border-border rounded-xl shadow-card z-10 overflow-hidden animate-in fade-in slide-in-from-top-2"
            >
              <button
                className="block w-full text-left px-4 py-2 hover:bg-muted text-base transition-colors"
                onClick={() => { exportTasksPDF(filteredTasks); setShowExportMenu(false); }}
              >
                Export as PDF
              </button>
              <button
                className="block w-full text-left px-4 py-2 hover:bg-muted text-base transition-colors"
                onClick={() => { exportTasksCSV(filteredTasks); setShowExportMenu(false); }}
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 md:px-8 bg-gradient-to-br from-card to-background">
        {renderHeader}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-7 items-stretch mt-8">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-muted animate-pulse rounded-xl h-32 w-full shadow-card transition-transform hover:scale-105 hover:shadow-md active:scale-95" />
          ))}
        </div>
      </div>
    );
  }
  if (filteredTasks.length === 0) {
    return (
      <div className="max-w-3xl w-full mx-auto px-8 py-16 bg-gradient-to-br from-card to-background rounded-3xl shadow-card flex flex-col items-center animate-fade-in transition-all duration-300">
        {renderHeader}
        <div className="flex flex-col items-center justify-center gap-8 w-full min-h-[350px] bg-background rounded-3xl shadow-card p-12">
          <FaUmbrellaBeach className="text-[90px] text-muted opacity-80 animate-bounce" />
          <span className="text-lg text-muted-foreground opacity-90 text-center font-medium">
            It looks like there are no tasks available.<br />Click above to add a new task
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl w-full mx-auto px-6 sm:px-10 md:px-16 py-10 bg-gradient-to-br from-card to-background min-h-[400px] rounded-3xl shadow-card">
      {renderHeader}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-7 items-stretch">
        {filteredTasks.map((singleTask, idx) => (
          <motion.div
            key={singleTask.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ scale: 1.04 }}
          >
            <SingleTask singleTask={singleTask} />
          </motion.div>
          ))}
      </div>
    </div>
  );
}

export function SingleTask({ singleTask }: { singleTask: Task }) {
  const { updateTaskFunction, setTaskSelected, setIsTaskDialogOpened } = useTasksStore();
  const [loading, setLoading] = useState(false);

  async function handleCheckboxChange() {
    setLoading(true);
    const updateTaskObject: Task = {
      ...singleTask,
      status: singleTask.status === "completed" ? "in progress" : "completed",
    };
    const result = await updateTaskFunction(updateTaskObject);
    if (!result.success) {
      toast({ title: "error" });
    }
    setLoading(false);
  }

  return (
    <div
      className={
        `bg-card rounded-xl shadow-card text-foreground border border-border p-4 sm:p-5 md:p-6 flex flex-col gap-2 transition-all duration-200 transition-transform hover:scale-105 hover:shadow-md active:scale-95`
      }
    >
      <div className="flex items-start gap-3">
        <span className="flex items-center cursor-grab text-muted-foreground opacity-70 mr-1 select-none">
          <HiDotsVertical className="w-5 h-5" />
        </span>
        {loading ? (
          <CircularProgress size={"20px"} color="inherit" />
        ) : (
          <Checkbox
            id={`task-${singleTask.id}`}
            className="w-5 h-5 mt-1 text-primary"
            checked={singleTask.status === "completed"}
            onCheckedChange={handleCheckboxChange}
          />
        )}
        <label
          onClick={() => {
            setTaskSelected(singleTask);
            setIsTaskDialogOpened(true);
          }}
          htmlFor="task"
          className="text-base font-medium text-foreground cursor-pointer hover:text-primary transition-colors truncate max-w-[160px]"
          title={singleTask.name}
        >
          {singleTask.name}
        </label>
      </div>
      <div className="flex items-center gap-2 mt-1">
        <span
          className={`bg-muted text-muted-foreground rounded-full text-xs px-2 py-0.5 font-medium
            ${singleTask.status === 'completed' ? 'bg-completed/20 text-completed' : singleTask.status === 'in progress' ? 'bg-in-progress/20 text-in-progress' : ''}
          `}
        >
          {singleTask.status}
        </span>
        <span
          className={`rounded-full text-xs px-2 py-0.5 font-medium
            ${singleTask.priority === 'high' ? 'bg-destructive/20 text-destructive' : singleTask.priority === 'medium' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}
          `}
        >
          {singleTask.priority}
        </span>
      </div>
      <div className="flex justify-between items-end mt-2">
        <div />
        <div className="flex gap-2 items-center">
          <TasksOptions singleTask={singleTask} />
        </div>
      </div>
    </div>
  );
}
