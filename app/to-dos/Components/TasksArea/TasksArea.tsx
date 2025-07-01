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
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-gray-800">Your Tasks</h2>
        <div className="flex items-center gap-3">
          <TasksDialog />
          <button
            className="bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 text-sm font-medium"
            onClick={() => setShowAiInput && setShowAiInput(true)}
          >
            + Add Task (AI)
          </button>
          <DeleteDialog />
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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 items-stretch">
        {filteredTasks.map((singleTask) => (
          <SingleTask key={singleTask.id} singleTask={singleTask} />
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

  const lowerOpacity = singleTask.status === "completed" ? "opacity-65" : "";

  return (
    <div
      className={`bg-white rounded-xl shadow-md border border-gray-200 flex flex-col justify-between p-5 min-h-[240px] max-h-[340px] h-full overflow-hidden transition hover:shadow-lg cursor-pointer ${lowerOpacity}`}
    >
      <div className="flex items-center gap-3 mb-2">
        {loading ? (
          <CircularProgress size={"18px"} color="inherit" />
        ) : (
          <Checkbox
            id={`task-${singleTask.id}`}
            className="w-5 h-5"
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
          className="text-lg font-semibold cursor-pointer hover:text-blue-700"
        >
          {singleTask.name}
        </label>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <Badge variant="outline" className="text-[11px] opacity-70 px-2 py-1 rounded-full">
          {singleTask.status}
        </Badge>
        <div className="flex gap-2 items-center">
          <ComboboxDemo singleTask={singleTask} />
          <TasksOptions singleTask={singleTask} />
        </div>
      </div>
    </div>
  );
}
