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
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { HiSparkles } from "react-icons/hi2";

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
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);

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
    const appTitle = 'Prompter AI';
    const reportTitle = 'QuickTask Report';
    const exportDate = new Date();
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    };
    const formatTime = (dateStr: string) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
    };
    // Group tasks by date (YYYY-MM-DD)
    const grouped = filteredTasks.reduce((acc, task) => {
      const dateKey = task.startTime ? task.startTime.slice(0, 10) : 'No Date';
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(task);
      return acc;
    }, {} as Record<string, any[]>);
    // PDF styling
    let y = 20;
    doc.setFontSize(20);
    doc.setTextColor(59, 130, 246); // primary color
    doc.text(appTitle, 105, y, { align: 'center' });
    y += 10;
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(reportTitle, 105, y, { align: 'center' });
    y += 8;
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // gray for subtitle
    doc.text(`Exported on: ${exportDate.toLocaleString()}`, 105, y, { align: 'center' });
      y += 10;
    doc.setDrawColor(229, 231, 235); // border color
    doc.line(20, y, 190, y);
    y += 8;
    Object.keys(grouped).sort().forEach((dateKey: string) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(13);
      doc.setTextColor(71, 85, 105);
      doc.text(`Date: ${formatDate(dateKey)}`, 20, y);
      y += 7;
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y, 190, y);
      y += 4;
      // Table header
      doc.setFontSize(11);
      doc.setTextColor(59, 130, 246);
      doc.setFont('', 'bold');
      doc.text('Task', 24, y);
      doc.text('Time', 100, y);
      doc.text('Status', 135, y);
      doc.text('Priority', 165, y);
      doc.setFont('', 'normal');
      y += 7;
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y, 190, y);
      y += 2;
      grouped[dateKey].forEach((task: any) => {
      if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`${task.name ?? ''}`, 24, y);
        doc.text(`${formatTime(task.startTime) ?? ''}`, 100, y);
        doc.text(`${task.status ? task.status.charAt(0).toUpperCase() + task.status.slice(1) : ''}`, 135, y);
        doc.text(`${task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : ''}`, 165, y);
        y += 9; // more vertical space between rows
      });
      y += 6; // extra space after each date section
      doc.setDrawColor(229, 231, 235);
      doc.line(20, y, 190, y);
      y += 8;
    });
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text('QuickTask — https://quicktask.app', 105, 290, { align: 'center' });
    doc.save('tasks_report.pdf');
  };

  // Compute filtered tasks in dashboard for export
  const filteredTasks = tasks.filter(task => {
    const matchesQuery = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesQuery && matchesPriority && matchesStatus;
  });

  return (
    <div className="min-h-screen flex bg-background font-sans antialiased transition-colors duration-300 text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border flex flex-col p-6 min-h-screen shadow-card transition-colors duration-300 antialiased">
        <div className="mb-8">
          <span className="text-2xl font-bold text-primary font-sans">PROMPTER AI</span>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          <div className="text-xs text-muted-foreground mb-2 tracking-wide uppercase font-semibold font-sans">Folders</div>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-primary font-medium font-sans text-base transition-colors">Dashboard</button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-foreground font-medium font-sans text-base transition-colors">Favorites</button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-muted-foreground font-medium font-sans text-base transition-colors">Archived</button>
          <Link href="/to-dos/calendar">
            <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-primary font-medium font-sans text-base w-full flex items-center gap-2 transition-colors">
              <span role="img" aria-label="calendar"></span>Calendar View
            </button>
          </Link>
        </nav>
        <div className="mt-auto text-xs text-muted-foreground">Templates, Settings, etc.</div>
      </aside>

      {/* Main Content */}
      <AnimatePresence>
        <motion.main
          key="dashboard-main"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out antialiased text-foreground"
        >
          {/* AI Prompt Panel Animation */}
          <div
            className={`fixed top-0 right-0 h-full w-full max-w-md bg-card shadow-lg z-50 p-6 overflow-y-auto rounded-l-xl transition-all duration-300 ease-in-out
            ${isPromptPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}`}
            style={{ pointerEvents: isPromptPanelOpen ? 'auto' : 'none' }}
          >
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring rounded-full transition"
              aria-label="Close AI Input"
              onClick={() => setIsPromptPanelOpen(false)}
            >
              ×
            </button>
            {/* AI Prompt Panel Content (move your AI prompt input here) */}
            {showAiInput && showInput && (
              <section className="mb-8 rounded-xl shadow-card bg-card text-foreground p-8 relative">
                <h2 className="text-xl font-semibold mb-6">AI Task Prompt</h2>
                <div className="mb-4 text-sm text-muted-foreground">Describe your goal and let AI create your tasks:</div>
                <input
                  ref={aiPromptRef}
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g. Build a portfolio in 2 weeks"
                  className="p-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground w-full mb-2"
                />
                {lastAIPrompt && (
                  <div className="text-xs text-muted-foreground">Last prompt: {lastAIPrompt}</div>
                )}
              </section>
            )}
          </div>

          {/* Top Bar */}
          <div className="flex items-center justify-between px-10 py-5 border-b border-border bg-card shadow-card">
            {/* Left: Create with AI Button */}
            <Button
              variant="default"
              className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg shadow-card bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
              onClick={() => {
                setShowAiInput(true);
                setShowInput(true);
                setIsPromptPanelOpen(true);
              }}
            >
              <HiSparkles className="text-lg mr-1" />
              Create with AI
            </Button>

            {/* Center: Search Bar */}
            <div className="flex-1 flex justify-center">
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full max-w-xl bg-muted text-foreground placeholder:text-muted-foreground rounded-full px-5 py-2 text-base outline-none border border-border focus:ring-2 focus:ring-ring transition"
              />
            </div>

            {/* Right: Icon Buttons for Filters and Export */}
            <div className="flex items-center gap-3">
              {/* Priority Filter */}
              <HoverCard>
                <HoverCardTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shadow-card bg-card border border-border text-foreground hover:bg-accent/30 transition-colors">
                    <FiFilter className="text-xl transition-transform duration-200 hover:rotate-6 hover:scale-110" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent sideOffset={8} className="w-40 p-2 rounded-xl shadow-card bg-card border border-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold mb-1 text-muted-foreground">Priority</span>
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
                  <Button variant="outline" size="icon" className="rounded-full shadow-card bg-card border border-border text-foreground hover:bg-accent/30 transition-colors">
                    <FiCheckSquare className="text-xl transition-transform duration-200 hover:rotate-6 hover:scale-110" />
                  </Button>
                </HoverCardTrigger>
                <HoverCardContent sideOffset={8} className="w-40 p-2 rounded-xl shadow-card bg-card border border-border">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold mb-1 text-muted-foreground">Status</span>
                    <Button variant={filterStatus === 'all' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('all')}>All</Button>
                    <Button variant={filterStatus === 'in progress' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('in progress')}>In Progress</Button>
                    <Button variant={filterStatus === 'completed' ? 'default' : 'ghost'} size="sm" className="justify-start" onClick={() => setFilterStatus('completed')}>Completed</Button>
                  </div>
                </HoverCardContent>
              </HoverCard>
              {/* Export Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full shadow-card bg-card border border-border text-foreground hover:bg-accent/30 transition-colors">
                    <FiDownload className="text-xl transition-transform duration-200 hover:rotate-6 hover:scale-110" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-card bg-card border border-border">
                  <DropdownMenuItem onClick={() => handleExportPDF(filteredTasks)} className="hover:bg-accent/30 transition-colors">
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExportCSV(filteredTasks)} className="hover:bg-accent/30 transition-colors">
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

          <Separator className="my-4 border-t border-border" />

          {/* Main Dashboard Area */}
          <div id="exportContent" className="flex-1 p-12 bg-background text-foreground rounded-xl shadow-card max-w-6xl mx-auto print:max-w-full print:rounded-none print:shadow-none print:bg-white">
            <section className="mb-8 rounded-xl shadow-card bg-card text-foreground p-8">
              <h2 className="text-2xl font-bold mb-6">Task Statistics</h2>
              <Stats />
            </section>
            {aiTasks.length > 0 && showOutput && (
              <section className="mb-8 rounded-xl shadow-card bg-card text-foreground p-8">
                <h2 className="text-xl font-semibold mb-6">AI-Generated Tasks</h2>
                <table className="table-auto w-full border-collapse">
                  <thead>
                    <tr className="bg-muted text-foreground font-semibold">
                      <th className="border border-input p-2 text-left text-sm">#</th>
                      <th className="border border-input p-2 text-left text-sm">Task</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aiTasks.map((task, idx) => (
                      <tr key={idx}>
                        <td className="border border-input p-2 text-sm w-12">{idx + 1}</td>
                        <td className="border border-input p-2 text-sm">{task}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
            <section className="mb-8">
              <TasksArea
                searchQuery={searchQuery}
                filterPriority={filterPriority}
                filterStatus={filterStatus}
                setShowAiInput={setShowAiInput}
              />
            </section>
          </div>

          <Separator className="my-4 border-t border-border" />

          <TasksFooter />
        </motion.main>
      </AnimatePresence>
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
