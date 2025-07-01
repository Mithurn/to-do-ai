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

export function TasksArea({ searchQuery = '', filterPriority = 'all', filterStatus = 'all', setShowAiInput }: { searchQuery?: string, filterPriority?: string, filterStatus?: string, setShowAiInput?: (open: boolean) => void }) {
  const { tasks, fetchTasks } = useTasksStore();
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

  if (filteredTasks.length === 0) {
  return (
      <div className="col-span-full h-full w-full flex items-center justify-center flex-col gap-6">
          <FaUmbrellaBeach className="text-[79px] text-slate-500 opacity-85" />
          <span className="text-sm text-slate-400 opacity-85 text-center">
          It looks like there are no tasks available. <br /> Click above to add a new task
          </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl w-full mx-auto px-4 md:px-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3 transition-colors duration-300 antialiased">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Tasks</h2>
        <div className="flex items-center gap-3">
          <TasksDialog />
          <button
            className="bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 text-sm font-medium dark:bg-[#333] dark:text-white dark:border dark:border-gray-700 dark:hover:bg-[#444]"
            onClick={() => setShowAiInput && setShowAiInput(true)}
          >
            + Add Task (AI)
          </button>
          <DeleteDialog />
          <div className="relative">
            <button
              className="bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200 text-sm font-medium dark:bg-[#333] dark:text-white dark:border dark:border-gray-700 dark:hover:bg-[#444]"
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
                  onClick={() => { exportTasksPDF(filteredTasks); setShowExportMenu(false); }}
                >
                  Export as PDF
                </button>
                <button
                  className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  onClick={() => { exportTasksCSV(filteredTasks); setShowExportMenu(false); }}
                >
                  Export as CSV
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
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

  // Color cues for status and priority
  const statusColor = singleTask.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-800';
  const priorityColor =
    singleTask.priority === 'high' ? 'bg-red-100 text-red-700' :
    singleTask.priority === 'medium' ? 'bg-orange-100 text-orange-700' :
    'bg-blue-100 text-blue-700';

  return (
    <div
      className={
        `task-card bg-white dark:bg-[#1e1e1e] text-gray-900 dark:text-[#f5f5f5] rounded-3xl shadow-md dark:shadow-[0_4px_12px_rgba(255,255,255,0.05)] border border-gray-100 dark:border-gray-800 flex flex-col justify-between p-7 md:p-8 min-h-[220px] max-h-[340px] h-full overflow-hidden transition-colors duration-300 antialiased hover:shadow-lg dark:hover:shadow-[0_6px_24px_rgba(255,255,255,0.08)] hover:-translate-y-1 active:scale-[0.98] dark:hover:bg-[#2a2a2a]`
      }
    >
      <div className="flex items-start gap-3 mb-4">
        {loading ? (
          <CircularProgress size={"20px"} color="inherit" />
        ) : (
          <Checkbox
            id={`task-${singleTask.id}`}
            className="w-5 h-5 mt-1"
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
          className="text-xl font-bold cursor-pointer hover:text-blue-700 dark:hover:text-blue-400 transition-colors"
          >
            {singleTask.name}
          </label>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold
              ${singleTask.status === 'completed'
                ? 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-100'
                : 'bg-yellow-100 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100'}
            `}
          >
            {singleTask.status}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold
              ${singleTask.priority === 'high'
                ? 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-100'
                : singleTask.priority === 'medium'
                ? 'bg-orange-100 dark:bg-orange-800 text-orange-700 dark:text-orange-100'
                : 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-100'}
            `}
          >
            {singleTask.priority}
          </span>
        </div>
        <div className="flex gap-2 items-center">
          <TasksOptions singleTask={singleTask} />
        </div>
      </div>
    </div>
  );
}
