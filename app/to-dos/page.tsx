"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

import { useTasksStore } from "../stores/useTasksStore";
import { useUserStore } from "../stores/useUserStore";

import { TaskHeader } from "./Components/TaskHeader/TaskHeader";
import Stats from "./Components/Stats/Stats";
import { TasksArea } from "./Components/TasksArea/TasksArea";
import { TasksFooter } from "./Components/TaskFooter/TaskFooter";
import { TasksDialog } from "./Components/Dialogs/TaskDialog/TaskDialog";
import { UserProfile } from "./Components/TaskHeader/UserProfile";
import { DeleteDialog } from "./Components/Dialogs/ClearAllDialog/DeleteDialog";

export default function Dashboard() {
  const router = useRouter();
  const { user, validateUser } = useUserStore();
  const { addNewTask, setIsTaskDialogOpened } = useTasksStore();

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<string[]>([]);
  const aiPromptRef = useRef<HTMLInputElement>(null);

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

  // Handler for Create new AI button
  const handleCreateNewAI = () => {
    if (aiPromptRef.current) {
      aiPromptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      aiPromptRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f7f9fb] poppins">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col p-6 min-h-screen shadow-sm">
        <div className="mb-8">
          <span className="text-2xl font-bold text-blue-700">QuickTask</span>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <div className="text-xs text-gray-400 mb-2">Folders</div>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 text-blue-700 font-medium">All Tasks</button>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 text-gray-700">Favorites</button>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 text-gray-700">Archived</button>
        </nav>
        <div className="mt-auto text-xs text-gray-400">Templates, Settings, etc.</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Delete Dialog at root level for global modal */}
        <DeleteDialog />
        {/* Top Bar */}
        <div className="flex items-center justify-between px-10 py-6 border-b bg-white shadow-sm">
          <div className="flex gap-3">
            <button
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-5 py-2 rounded-full font-semibold shadow hover:brightness-110 transition"
              onClick={handleCreateNewAI}
            >
              + Create new AI
            </button>
            <button
              className="bg-white border border-blue-600 text-blue-600 px-5 py-2 rounded-full font-semibold shadow hover:bg-blue-50 transition"
              onClick={() => setIsTaskDialogOpened(true)}
            >
              + New Task
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* User profile dropdown/menu */}
            <UserProfile />
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-10">
          {/* AI Prompt Section */}
          <div className="mb-8 bg-white rounded-xl shadow p-6 flex flex-col gap-3 max-w-2xl">
            <label className="text-sm font-medium text-gray-600">
              Describe your goal and let AI create your tasks:
            </label>
            <div className="flex gap-2">
              <input
                ref={aiPromptRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="e.g. Build a portfolio in 2 weeks"
                className="flex-1 p-2 rounded border border-gray-300 focus:outline-none focus:ring focus:ring-blue-300"
              />
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 min-w-[160px]"
              >
                {loading ? "Generating..." : "Generate Tasks with AI"}
              </button>
            </div>
          </div>

          {/* AI Task List */}
          {aiTasks.length > 0 && (
            <div className="mb-8 bg-white rounded-xl shadow p-6 max-w-2xl">
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
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Tasks</h2>
              <p className="text-sm text-gray-400">{formatDate()}</p>
            </div>
            <TasksDialog />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            <TasksArea />
          </div>
        </div>
      </main>
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
