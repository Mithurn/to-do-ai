import { Checkbox } from "@/components/ui/checkbox";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComboboxDemo } from "./PriorityCombobox";
import { TasksOptions } from "./TasksOptions";
import { useTasksStore } from "@/app/stores/useTasksStore";
import { Task } from "@/app/data/Tasks";
import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";
import CircularProgress from "@mui/material/CircularProgress";
import { FaUmbrellaBeach } from "react-icons/fa6";
import { useUserStore } from "@/app/stores/useUserStore";
export function TasksArea() {
  const { tasks, fetchTasks } = useTasksStore();
  const { user } = useUserStore();

  useEffect(() => {
    getTasksData(user);
  }, [user]);

  async function getTasksData(user: { id: string; email: string } | null) {
    await fetchTasks(user);
  }

  if (tasks.length === 0) {
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
    <>
      {tasks.map((singleTask) => (
        <SingleTask key={singleTask.id} singleTask={singleTask} />
      ))}
    </>
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
      className={`bg-white rounded-xl shadow-md border border-gray-200 flex flex-col justify-between p-5 min-h-[170px] transition hover:shadow-lg cursor-pointer ${lowerOpacity}`}
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
