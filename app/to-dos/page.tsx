"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Link from 'next/link';
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { FiFilter, FiCheckSquare, FiDownload, FiPlus } from "react-icons/fi";
import ClientDarkModeToggle from "../ClientDarkModeToggle";

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
  const { addNewTask, setIsTaskDialogOpened, setLastAIPrompt, lastAIPrompt, deleteTaskFunction, setTasks, setTaskSelected } = useTasksStore();
  const { tasks } = useTasksStore(); // <-- Add this line

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTasks, setAiTasks] = useState<string[]>([]);
  const aiPromptRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showAiInput, setShowAiInput] = useState(false);
  const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);

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
    <div className="min-h-screen flex bg-[#f7f9fb] dark:bg-[#121212] poppins antialiased transition-colors duration-300 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-[#1e1e1e] border-r border-gray-200 dark:border-gray-800 flex flex-col p-6 min-h-screen shadow-sm transition-colors duration-300 antialiased text-gray-900 dark:text-gray-300">
        <div className="mb-8">
          <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">QuickTask</span>
        </div>
        <nav className="flex-1 flex flex-col gap-4">
          <div className="text-xs text-gray-400 dark:text-gray-500 mb-2">Folders</div>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 font-medium">All Tasks</button>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300">Favorites</button>
          <button className="text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900 text-gray-700 dark:text-gray-300">Archived</button>
          <Link href="/to-dos/calendar">
            <button className="text-left px-3 py-2 rounded hover:bg-blue-50 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-400 font-medium w-full flex items-center gap-2">
              <span role="img" aria-label="calendar">🗓️</span> Calendar View
            </button>
          </Link>
        </nav>
        <div className="mt-auto text-xs text-gray-400 dark:text-gray-500">Templates, Settings, etc.</div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen transition-colors duration-300 antialiased text-gray-900 dark:text-gray-100">
        {/* Top Bar - original layout */}
        <div className="flex items-center justify-between px-10 py-4 border-b bg-white shadow-sm dark:bg-black/60">
          {/* Left: + Create Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="default" className="flex items-center gap-2 font-semibold px-4 py-2 rounded-full shadow-md bg-white dark:bg-[#2a2a2a] text-black dark:text-white border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#333]">
                <FiPlus className="text-lg" />
                + Create
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowAiInput(true)}>
                <span className="flex items-center gap-2">🤖 Create with AI</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setIsTaskDialogOpened(true); setTaskSelected(null); }}>
                <span className="flex items-center gap-2">✏️ Create manually</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Center: Search Bar */}
          <div className="flex-1 flex justify-center">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full max-w-xl bg-gray-100 dark:bg-[#2a2a2a] text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-full px-5 py-2 text-base outline-none border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-200 transition"
            />
          </div>

          {/* Right: Icon Buttons for Filters and Export */}
          <div className="flex items-center gap-3">
            {/* Priority Filter */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                  <FiFilter className="text-xl" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent sideOffset={8} className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold mb-1">Priority</span>
                  <Button variant={filterPriority === 'all' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterPriority('all')}>All</Button>
                  <Button variant={filterPriority === 'low' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterPriority('low')}>Low</Button>
                  <Button variant={filterPriority === 'medium' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterPriority('medium')}>Medium</Button>
                  <Button variant={filterPriority === 'high' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterPriority('high')}>High</Button>
                </div>
              </HoverCardContent>
            </HoverCard>
            {/* Status Filter */}
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                  <FiCheckSquare className="text-xl" />
                </Button>
              </HoverCardTrigger>
              <HoverCardContent sideOffset={8} className="w-40 p-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-semibold mb-1">Status</span>
                  <Button variant={filterStatus === 'all' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('all')}>All</Button>
                  <Button variant={filterStatus === 'in progress' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('in progress')}>In Progress</Button>
                  <Button variant={filterStatus === 'completed' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('completed')}>Completed</Button>
                </div>
              </HoverCardContent>
            </HoverCard>
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full shadow-sm">
                  <FiDownload className="text-xl" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportPDF(filteredTasks)}>
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportCSV(filteredTasks)}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* User Profile */}
            <div className="ml-2">
              <UserProfile />
            </div>
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div className="flex-1 p-10">
          <Stats />
        {/* AI Prompt Section */}
          {showAiInput && showInput && (
            <div className="relative w-full max-w-4xl mx-auto p-4 bg-white dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 rounded-xl shadow-md mb-8 flex flex-col gap-3">
              <button
                onClick={() => setShowInput(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
                aria-label="Close AI Input"
              >
                ×
              </button>
              <label className="text-sm font-medium text-gray-600">
                Describe your goal and let AI create your tasks:
              </label>
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mt-4">
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
                  className="px-4 py-2 rounded-md font-medium transition text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 min-w-[160px]"
                >
                  {loading ? "Generating..." : "Generate Tasks with AI"}
                </button>
                {lastAIPrompt && (
                  <button
                    onClick={handleRegeneratePlan}
                    disabled={loading}
                    className="px-4 py-2 rounded-md font-medium transition text-blue-600 border border-blue-600 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900 min-w-[160px]"
                  >
                    🔁 Regenerate Plan
                  </button>
                )}
              </div>
            </div>
          )}

        {/* AI Task List */}
        {aiTasks.length > 0 && showOutput && (
          <div className="relative w-full max-w-3xl mx-auto mt-6 p-4 bg-white dark:bg-[#1a1a1a] text-black dark:text-white rounded-md shadow-md">
            <button
              onClick={() => setShowOutput(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 transition"
              aria-label="Close AI Output"
            >
              ×
            </button>
            <div className="text-sm text-gray-400 mb-2">AI-Generated Tasks</div>
            <ul className="list-disc list-inside space-y-2">
              {aiTasks.map((task, idx) => (
                <li key={idx}>{task}</li>
              ))}
            </ul>
            <button
              onClick={handleSaveAITasks}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md mt-4 mx-auto block"
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
      {/* Fixed dark mode toggle in bottom right */}
      <div className="fixed bottom-4 right-4 z-50">
        <ClientDarkModeToggle />
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
