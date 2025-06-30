"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useTasksStore } from "../stores/useTasksStore";
import { useUserStore } from "../stores/useUserStore";

import { TaskHeader } from "./Components/TaskHeader/TaskHeader";
import Stats from "./Components/Stats/Stats";
import { TasksArea } from "./Components/TasksArea/TasksArea";
import { TasksFooter } from "./Components/TaskFooter/TaskFooter";
import { TasksDialog } from "./Components/Dialogs/TaskDialog/TaskDialog";

export default function Dashboard() {
  const router = useRouter();
  const { user, validateUser } = useUserStore();
  const { addNewTask } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<string[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const isAuthenticated = await validateUser();
      if (!isAuthenticated) router.push("/");
    };
    checkUser();
  }, [router]);

  if (!user) return null;

  // Generate AI Tasks
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const { tasks } = await res.json();
      const lines = tasks.split("\n").filter((line: string) => line.trim() !== "");
      setAiTasks(lines);
    } catch (error) {
      console.error("AI generation failed:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save AI Tasks into Task Store
  const handleSaveAITasks = async () => {
    if (!user || aiTasks.length === 0) return;

    for (const taskTitle of aiTasks) {
    const newTask = {
  id: uuidv4(),
  title: taskTitle,
  name: taskTitle,
  description: "",
  userId: user.id,
  status: "in progress" as "in progress" | "completed",
  completed: false,
  priority: "medium" as "medium" | "low" | "high",
  dueDate: new Date().toISOString(),
};


      await addNewTask(newTask);
    }

    setAiTasks([]);
    setPrompt("");
  };

  return (
    <div className="min-h-screen border flex items-center w-full justify-center poppins">
      <div className="w-[55%] border border-gray-400 flex flex-col gap-6 bg-inherit shadow-md rounded-md p-8">

        {/* Header */}
        <TaskHeader />

        {/* AI Prompt Section */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-600">
            Describe your goal and let AI create your tasks:
          </label>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Build a portfolio in 2 weeks"
            className="p-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300"
          />
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            {loading ? "Generating..." : "Generate Tasks with AI"}
          </button>
        </div>

        {/* AI Task List */}
        {aiTasks.length > 0 && (
          <div className="mt-4">
            <h3 className="text-md font-semibold mb-2">AI-Generated Tasks:</h3>
            <ul className="list-disc list-inside text-gray-700">
              {aiTasks.map((task, idx) => (
                <li key={idx}>{task}</li>
              ))}
            </ul>
            <button
              onClick={handleSaveAITasks}
              className="mt-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Save Tasks to My List
            </button>
          </div>
        )}

        {/* Stats and Tasks */}
        <Stats />
        <AllTasksHeader />
        <TasksArea />
        <TasksFooter />
      </div>
    </div>
  );
}

function AllTasksHeader() {
  return (
    <div className="flex justify-between items-center mt-4 mb-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">{`Today's Task`}</h2>
        <p className="text-sm text-gray-400">{formatDate()}</p>
      </div>
      <TasksDialog />
    </div>
  );
}

function formatDate(date: Date = new Date()): string {
  const options: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "long",
    year: "numeric",
  };
  return date.toLocaleDateString("en-GB", options);
}
