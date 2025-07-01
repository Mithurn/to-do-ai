import { useTasksStore } from "@/app/stores/useTasksStore";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";

type SingleStat = { label: string; unit: string; counter: number };

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  return new Date(d.setDate(diff));
}

function getEndOfWeek(date: Date) {
  const start = getStartOfWeek(date);
  return new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7, 0, 0, 0, 0);
}

export default function Stats() {
  const [statsArray, setStatsArray] = useState<SingleStat[]>([
    { label: "Completed", unit: "Tasks", counter: 3 },
    { label: "Pending", unit: "Tasks", counter: 4 },
    { label: "Progress", unit: "%", counter: 4 },
  ]);

  const { tasks } = useTasksStore();
  const now = new Date();
  const weekStart = getStartOfWeek(now);
  const weekEnd = getEndOfWeek(now);

  const weeklyTasks = tasks.filter(task => {
    if (!task.startTime) return false;
    const t = new Date(task.startTime);
    return t >= weekStart && t < weekEnd;
  });
  const completed = weeklyTasks.filter(task => task.status === "completed").length;
  const total = weeklyTasks.length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  let message = "Keep going!";
  if (total > 0 && completed === total) message = "🎉 All done! Great job!";
  else if (completed > 0) message = "Nice! You're making progress.";

  useEffect(() => {
    const getCompletedTasks = tasks.filter(
      (task) => task.status === "completed"
    ).length;

    const getPendingTasks = tasks.length - getCompletedTasks;
    const getProgressValue = (getCompletedTasks / tasks.length) * 100;

    setStatsArray([
      { label: "Completed", unit: "Tasks", counter: getCompletedTasks },
      { label: "Pending", unit: "Tasks", counter: getPendingTasks },
      {
        label: "Progress",
        unit: "%",
        counter: parseInt(getProgressValue.toFixed(2)) || 0,
      },
    ]);
  }, [tasks]);

  return (
    <div className="flex gap-5 py-5">
      {statsArray.map((stat, index) => (
        <div key={index} className="flex w-full     gap-5  ">
          <SingleStatCard stat={stat} key={index} />
          {index < statsArray.length - 1 && (
            <Separator orientation="vertical" className="h-auto" />
          )}
        </div>
      ))}

      <div className="mb-6 w-full max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-1">
          <span className="font-semibold text-gray-700">Weekly Progress</span>
          <span className="text-sm text-gray-500">{`You're ${completed}/${total} tasks done this week!`}</span>
        </div>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-3 bg-green-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-gray-500 text-center">{message}</div>
      </div>

      {/* Separator with correct height and vertical orientation */}
    </div>
  );
}

function SingleStatCard({ stat }: { stat: SingleStat }) {
  return (
    <div className="w-full flex flex-col gap-2 items-center ">
      <div className="flex justify-between items-center">
        <p className="text-xl font-medium text-gray-500">{stat.label}</p>
      </div>
      <div className="flex gap-1  items-baseline  ">
        <p className="text-3xl font-bold mt-1 ">{stat.counter}</p>
        <p className="text-gray-400">{stat.unit}</p>
      </div>
    </div>
  );
}
