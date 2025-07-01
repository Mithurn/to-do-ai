import { useTasksStore } from "@/app/stores/useTasksStore";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { FaCheckCircle, FaClock, FaChartLine, FaStar } from "react-icons/fa";
import CircularProgress from "@mui/material/CircularProgress";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

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
  const [weeklyTarget, setWeeklyTarget] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('weeklyTarget');
      return stored ? parseInt(stored) : 10;
    }
    return 10;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('weeklyTarget', String(weeklyTarget));
    }
  }, [weeklyTarget]);

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
  const percent = weeklyTarget === 0 ? 0 : Math.round((completed / weeklyTarget) * 100);

  let message = "Keep going!";
  if (weeklyTarget > 0 && completed >= weeklyTarget) message = "🎉 All done! Great job!";
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

  // Card config for icons, colors, and microcopy
  const cardConfig = {
    Completed: {
      icon: <FaCheckCircle className="text-green-500 text-3xl mb-2" />,
      color: "bg-green-50",
      progressColor: "#22c55e",
      microcopy: "Great job!",
    },
    Pending: {
      icon: <FaClock className="text-yellow-500 text-3xl mb-2" />,
      color: "bg-yellow-50",
      progressColor: "#facc15",
      microcopy: "Stay focused!",
    },
    Progress: {
      icon: <FaChartLine className="text-blue-500 text-3xl mb-2" />,
      color: "bg-blue-50",
      progressColor: "#3b82f6",
      microcopy: "Keep going!",
    },
    Weekly: {
      icon: <FaStar className="text-purple-500 text-3xl mb-2" />,
      color: "bg-purple-50",
      progressColor: "#a78bfa",
      microcopy: message,
    },
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 py-5">
      {statsArray.map((stat, idx) => {
        const config = cardConfig[stat.label as keyof typeof cardConfig];
        const circleSize = stat.label === 'Completed' || stat.label === 'Pending' ? 90 : 70;
        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ scale: 1.04 }}
            className={`stat-card rounded-2xl p-6 flex flex-col items-center shadow-md ${config.color} dark:bg-[#1a1a1a] dark:border dark:border-[#333] dark:text-[#e4e4e7] dark:shadow-[0_2px_6px_rgba(255,255,255,0.05)] transition-colors duration-300`}
          >
            {config.icon}
            <div className="relative flex items-center justify-center mb-2">
              <CircularProgress
                variant="determinate"
                value={stat.label === "Progress" ? stat.counter : stat.label === "Completed" ? 100 : 100}
                size={circleSize}
                thickness={5}
                style={{ color: config.progressColor, background: "transparent" }}
              />
              <span className="absolute text-2xl font-bold text-gray-800 dark:text-gray-100">
                {stat.counter}
                <span className="text-base font-medium text-gray-400 dark:text-gray-300 ml-1">{stat.unit}</span>
              </span>
            </div>
            <div className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-1">{stat.label}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{config.microcopy}</div>
          </motion.div>
        );
      })}
      {/* Weekly Progress Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: statsArray.length * 0.05 }}
        whileHover={{ scale: 1.04 }}
        className={`stat-card rounded-2xl p-6 flex flex-col items-center shadow-md ${cardConfig.Weekly.color} group relative dark:bg-[#1a1a1a] dark:border dark:border-[#333] dark:text-[#e4e4e7] dark:shadow-[0_2px_6px_rgba(255,255,255,0.05)] transition-colors duration-300`}
      >
        {cardConfig.Weekly.icon}
        <div className="relative flex items-center justify-center mb-2">
          <CircularProgress
            variant="determinate"
            value={percent}
            size={90}
            thickness={5}
            style={{ color: cardConfig.Weekly.progressColor, background: "transparent" }}
          />
          <span className="absolute text-2xl font-bold text-gray-800 dark:text-gray-100">
            {percent}
            <span className="text-base font-medium text-gray-400 dark:text-gray-300 ml-1">%</span>
          </span>
        </div>
        <div className="text-lg font-semibold text-gray-700 dark:text-gray-100 mb-1">Weekly Progress</div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-500 dark:text-gray-400">{`You're ${completed}/${weeklyTarget} tasks done this week!`}</span>
          <Input
            type="number"
            min={1}
            value={weeklyTarget}
            onChange={e => setWeeklyTarget(Number(e.target.value))}
            className="w-16 h-7 text-sm px-2 py-1 rounded border border-gray-300 bg-white ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto"
            aria-label="Set weekly target"
          />
        </div>
        <div className="text-xs text-purple-500 mt-1 font-medium">{cardConfig.Weekly.microcopy}</div>
      </motion.div>
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
