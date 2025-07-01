"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Link from 'next/link';
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';

import { useTasksStore } from "../stores/useTasksStore";
import { useUserStore } from "../stores/useUserStore";

import { TaskHeader } from "./Components/TaskHeader/TaskHeader";
import Stats from "./Components/Stats/Stats";
import { TasksArea } from "./Components/TasksArea/TasksArea";
import { TasksFooter } from "./Components/TaskFooter/TaskFooter";
import { TasksDialog } from "./Components/Dialogs/TaskDialog/TaskDialog";
import { UserProfile } from "./Components/TaskHeader/UserProfile";
import { DeleteDialog } from "./Components/Dialogs/ClearAllDialog/DeleteDialog";
import TaskCalendar from './Components/TasksArea/TaskCalendar';

export default function Dashboard() {
  const router = useRouter();
  const { user, validateUser } = useUserStore();
  const { addNewTask, setIsTaskDialogOpened, setLastAIPrompt, lastAIPrompt, deleteTaskFunction, setTasks } = useTasksStore();
  const { tasks } = useTasksStore(); // <-- Add this line

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<string[]>([]);
  const aiPromptRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAiInput, setShowAiInput] = useState(false);

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
      setLastAIPrompt(prompt);
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
        startTime: new Date().toISOString(),
        endTime: undefined,
      };

      await addNewTask(newTask);
    }

    setAiTasks([]);
    setPrompt("");
  };

  // Regenerate Plan handler
  const handleRegeneratePlan = async () => {
    if (!user || !lastAIPrompt) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: lastAIPrompt }),
      });
      const { tasks: aiTasksString } = await res.json();
      const lines = aiTasksString.split("\n").filter((line: string) => line.trim() !== "");
      // Clear all tasks
      await deleteTaskFunction("deleteAll", user);
      // Add new tasks
      const newTasks = lines.map((taskTitle: string) => ({
        id: uuidv4(),
        title: taskTitle,
        name: taskTitle,
        description: "",
        userId: user.id,
        status: "in progress" as "in progress" | "completed",
        completed: false,
        priority: "medium" as "medium" | "low" | "high",
        dueDate: new Date().toISOString(),
        startTime: new Date().toISOString(),
        endTime: undefined,
      }));
      for (const task of newTasks) {
        await addNewTask(task);
      }
      setTasks(newTasks);
      toast({ title: "Plan regenerated!", description: "Your AI plan has been refreshed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to regenerate plan.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Handler for Create new AI button
  const handleCreateNewAI = () => {
    if (aiPromptRef.current) {
      aiPromptRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      aiPromptRef.current.focus();
    }
  };

  // Export visible tasks to CSV
  const handleExportCSV = (filteredTasks: any[]) => {
    if (!filteredTasks.length) return;
    const header = Object.keys(filteredTasks[0]);
    const csvRows = [header.join(",")];
    for (const row of filteredTasks) {
      csvRows.push(header.map(field => JSON.stringify(row[field] ?? "")).join(","));
    }
    const csv = csvRows.join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tasks.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Export visible tasks to PDF
  const handleExportPDF = (filteredTasks: any[]) => {
    if (!filteredTasks.length) return;
    const doc = new jsPDF();
    doc.text('Tasks', 10, 10);
    let y = 20;
    filteredTasks.forEach((task, idx) => {
      doc.text(`${idx + 1}. ${task.name} | ${task.priority} | ${task.status} | ${task.startTime || ''}`, 10, y);
      y += 10;
      if (y > 270) { doc.addPage(); y = 20; }
    });
    doc.save('tasks.pdf');
  };

  // Compute filtered tasks in dashboard for export
  const filteredTasks = tasks.filter(task => {
    const matchesQuery = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesQuery && matchesPriority && matchesStatus;
  });

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
          <Link href="/to-dos/calendar">
            <button className="text-left px-3 py-2 rounded hover:bg-blue-50 text-blue-700 font-medium w-full flex items-center gap-2">
              <span role="img" aria-label="calendar">🗓️</span> Calendar View
            </button>
          </Link>
        </nav>
        <div className="mt-auto text-xs text-gray-400">Templates, Settings, etc.</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar - compact, aligned */}
        <div className="flex items-center justify-between px-10 py-4 border-b bg-white shadow-sm">
          <div className="flex gap-3 items-center">
            <button
              className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-white px-5 py-2 rounded-full font-semibold shadow hover:brightness-110 transition"
              onClick={() => setShowAiInput(true)}
            >
              + Create new AI
            </button>
            {/* Search and Filters */}
            <div className="flex items-center gap-2 bg-gray-100 rounded px-2 py-1">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-transparent outline-none px-2 text-sm"
              />
              <select
                value={filterPriority}
                onChange={e => setFilterPriority(e.target.value)}
                className="bg-white border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="bg-white border rounded px-2 py-1 text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <UserProfile />
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-10">
          <Stats />
          {/* AI Prompt Section */}
          {showAiInput && (
            <div className="mb-8 bg-white rounded-xl shadow p-6 flex flex-col gap-3 max-w-2xl relative">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 text-lg font-bold"
                onClick={() => setShowAiInput(false)}
                aria-label="Quit AI Input"
              >
                ×
              </button>
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
                {lastAIPrompt && (
                  <button
                    onClick={handleRegeneratePlan}
                    disabled={loading}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 min-w-[160px]"
                  >
                    🔁 Regenerate Plan
                  </button>
                )}
              </div>
            </div>
          )}

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
          <div className="max-w-7xl w-full mx-auto">
            <TasksArea
              searchQuery={searchQuery}
              filterPriority={filterPriority}
              filterStatus={filterStatus}
              setShowAiInput={setShowAiInput}
            />
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
