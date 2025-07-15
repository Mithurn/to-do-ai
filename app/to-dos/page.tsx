"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import Link from 'next/link';
import { toast } from "@/hooks/use-toast";
import jsPDF from 'jspdf';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { FiFilter, FiCheckSquare, FiDownload, FiPlus, FiMenu, FiX } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { HiSparkles } from "react-icons/hi2";
import { FiUser } from "react-icons/fi";
import { Avatar } from "@/components/ui/avatar";

import { useTasksStore } from "../stores/useTasksStore";
import { useUserStore } from "../stores/useUserStore";
import type { Task } from "../data/Tasks";

import { TaskHeader } from "./Components/TaskHeader/TaskHeader";
import Stats from "./Components/Stats/Stats";
import { TasksArea } from "./Components/TasksArea/TasksArea";
import { TasksFooter } from "./Components/TaskFooter/TaskFooter";
import { TasksDialog } from "./Components/Dialogs/TaskDialog/TaskDialog";
import { UserProfile } from "./Components/TaskHeader/UserProfile";
import { DeleteDialog } from "./Components/Dialogs/ClearAllDialog/DeleteDialog";
import TaskCalendar from './Components/TasksArea/TaskCalendar';
// import { ClarificationCard } from "./Components/AI/ClarificationCard";
// import { TaskList } from "./Components/AI/TaskList";
import { ChatMessage, ChatMessageProps } from "./Components/AI/ChatMessage";
import { RightPanel } from "./Components/AI/RightPanel";

// Update types for AI messages
export type AIMessage = {
  role: "assistant" | "user";
  type: "chat" | "error";
  text?: string;
  clarifications?: string[];
};

export default function Dashboard() {
  const router = useRouter();
  const { user, validateUser } = useUserStore();
  const { addNewTask, setIsTaskDialogOpened, setLastAIPrompt, lastAIPrompt, deleteTaskFunction, setTasks, setTaskSelected } = useTasksStore();
  const { tasks: allTasks } = useTasksStore() as { tasks: Task[] };

  const [aiPrompt, setAiPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    { role: "assistant", text: "👋 Hi! What would you like help with today?", type: "chat" }
  ]);
  const [input, setInput] = useState("");
  const [editedTasks, setEditedTasks] = useState<any[]>([]);
  const [regenerating, setRegenerating] = useState(false);

  type AITask = {
    id: string;
    name: string;
    priority: string;
    status: string;
    startTime: string;
    endTime?: string;
    source?: string;
    [key: string]: any;
  };

  const [aiTasks, setAiTasks] = useState<AITask[]>([]);
  const aiPromptRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showOutput, setShowOutput] = useState(true);
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);

  const [lastAIDebug, setLastAIDebug] = useState<string | null>(null);

  const [clarificationAnswers, setClarificationAnswers] = useState<string[]>([]);
  const [aiClarification, setAiClarification] = useState<{
    clarificationNeeded: boolean;
    clarificationText?: string;
    clarifications?: string[];
  } | null>(null);
  const [aiTaskDraft, setAiTaskDraft] = useState<{
    tasks: any[];
    summaryMessage?: string;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [isClarifying, setIsClarifying] = useState(true);
  const [previewTasks, setPreviewTasks] = useState<any[]>([]);
  const [aiIsTyping, setAiIsTyping] = useState(false);

  const [isChatPanelOpen, setIsChatPanelOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    const checkUser = async () => {
      const isAuthenticated = await validateUser();
      if (!isAuthenticated) router.push("/");
    };
    checkUser();
  }, [router]);

  // When aiTaskDraft changes, sync editedTasks
  useEffect(() => {
    if (aiTaskDraft && Array.isArray(aiTaskDraft.tasks)) {
      setEditedTasks(aiTaskDraft.tasks);
    }
  }, [aiTaskDraft]);

  if (!user) return null;

  const handleGenerate = async () => {
    if (!aiPrompt.trim()) return;

    setLoading(true);
    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      });

      const data = await response.json();

      if (data && data.tasks) {
        setAiTasks(data.tasks);
        setLastAIPrompt(aiPrompt);
      } else {
        console.error("Invalid response from AI:", data);
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
    } finally {
      setLoading(false);
      setAiPrompt("");
    }
  };

  const handleSaveAITasks = async () => {
    if (!user || aiTasks.length === 0) return;

    for (const task of aiTasks) {
      const newTask = {
        id: uuidv4(),
        title: task.name,
        name: task.name,
        description: "",
        userId: user.id,
        status: "in progress" as "in progress" | "completed",
        completed: false,
        priority: (task.priority || "medium") as "high" | "medium" | "low",
        dueDate: new Date().toISOString(),
        startTime: task.startTime,
        endTime: task.endTime,
      };

      await addNewTask(newTask);
    }

    setAiTasks([]);
    setAiPrompt("");
    setIsPromptPanelOpen(false);
  };

  const processAIResponse = (data: any) => {
    // 1. Clarification mode: clarificationNeeded + clarifications present
    if (data.clarificationNeeded && Array.isArray(data.clarifications) && data.clarifications.length > 0) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: data.clarificationText || "I need some more info before I generate tasks for you!",
          type: "chat",
          clarifications: data.clarifications,
        },
      ]);
      setIsClarifying(true);
      setPreviewTasks([]);
      return;
    }

    // 2. Valid tasks generated (clarificationNeeded is false)
    if (!data.clarificationNeeded && Array.isArray(data.tasks) && data.tasks.length > 0) {
      setIsClarifying(false);
      setPreviewTasks(data.tasks);
      return;
    }

    // 3. Fallback: no tasks, no clarifications
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        text: data.clarificationText || "Sorry, I couldn't generate tasks. Could you provide more detail?",
        type: "chat",
      },
    ]);
    setIsClarifying(true);
    setPreviewTasks([]);
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: AIMessage = { role: "user", text: input, type: "chat" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setAiIsTyping(true);
    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: input,
          context: messages,
        }),
      });
      const data = await response.json();
      processAIResponse(data);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error generating tasks. Please try again.",
          type: "error",
        },
      ]);
      setIsClarifying(true);
      setPreviewTasks([]);
    } finally {
      setAiIsTyping(false);
    }
  };

  const handleRegenerateTasks = async () => {
    setRegenerating(true);
    setAiIsTyping(true);
    try {
      const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
      if (!lastUserMsg) return;
      const response = await fetch("/api/ai-generate/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: lastUserMsg.text,
          context: messages,
        }),
      });
      const data = await response.json();
      processAIResponse(data);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error regenerating tasks. Please try again.",
          type: "error",
        },
      ]);
      setIsClarifying(true);
      setPreviewTasks([]);
    } finally {
      setRegenerating(false);
      setAiIsTyping(false);
    }
  };

  const handleSaveEditedTasks = async () => {
    if (!user || !editedTasks.length) return;
    try {
      const response = await fetch("/api/tasks/save-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: editedTasks }),
      });
      const data = await response.json();
      if (response.ok && data.tasks) {
        setTasks([...allTasks, ...data.tasks]);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "✅ Tasks saved to your dashboard!",
            type: "chat",
          },
        ]);
        setIsPromptPanelOpen(false);
      } else if (data.error === "Not authenticated") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Please sign in to save tasks to your dashboard.",
            type: "chat",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.error || "Failed to save tasks.",
            type: "chat",
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Failed to save tasks.",
          type: "chat",
        },
      ]);
    }
  };

  const handleEditTaskDraft = (idx: number, updated: any) => {
    setEditedTasks((prev) => prev.map((t, i) => (i === idx ? { ...t, ...updated } : t)));
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
  const filteredTasks = allTasks.filter(task => {
    const matchesQuery = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    return matchesQuery && matchesPriority && matchesStatus;
  });

  // Mark a task as complete
  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = allTasks.map(task =>
      task.id === taskId ? { ...task, status: "completed" as "completed" } : task
    );
    setTasks(updatedTasks);
    toast({ title: "Task completed!", description: "Great job!" });
  };

  // Edit a task (for simplicity, just prompt for new name)
  const handleEditTask = (taskId: string) => {
    const arr = Array.isArray(allTasks) ? allTasks : [];
    const editedName = window.prompt("Edit task name:", arr.find((t) => t.id === taskId)?.name || "");
    if (editedName) {
      const updatedTasks = arr.map(t =>
        t.id === taskId ? { ...t, name: editedName, status: t.status as "in progress" | "completed" } : t
      );
      setTasks(updatedTasks);
      toast({ title: "Task updated!", description: "Your task was updated." });
    }
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = allTasks.filter(task => task.id !== taskId);
    setTasks(updatedTasks);
    toast({ title: "Task deleted!", description: "The task was removed." });
  };

  const handleSavePreviewTasks = async () => {
    if (!user || previewTasks.length === 0) return;
    for (const task of previewTasks) {
      const newTask = {
        id: uuidv4(),
        title: task.name,
        name: task.name,
        description: task.description || "",
        userId: user.id,
        status: "in progress" as "in progress" | "completed",
        completed: false,
        priority: (task.priority || "medium") as "high" | "medium" | "low",
        dueDate: task.due_date || new Date().toISOString(),
        startTime: task.startTime,
        endTime: task.endTime,
      };
      await addNewTask(newTask);
    }
    setPreviewTasks([]);
    setIsPromptPanelOpen(false);
    setIsClarifying(true);
  };

  return (
    <div className="min-h-screen flex bg-[#0f0f0f] font-sans antialiased transition-colors duration-300 text-[#f1f1f1]">
      {/* Mobile Hamburger Menu */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          className="p-2 rounded-full bg-[#23232A] text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          onClick={() => setMobileNavOpen(true)}
          aria-label="Open navigation menu"
        >
          <FiMenu className="w-7 h-7" />
        </button>
      </div>
      {/* Mobile Drawer */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          {/* Drawer */}
          <nav className="relative w-64 max-w-[80vw] h-full bg-[#1b1b1b] border-r border-[#2d2d2d] flex flex-col p-6 shadow-card animate-slide-in-left">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring rounded-full transition z-50"
              aria-label="Close navigation menu"
              onClick={() => setMobileNavOpen(false)}
            >
              <FiX />
            </button>
            <div className="mb-8 mt-2">
              <span className="text-2xl font-bold text-[#3b82f6] font-sans">PROMPTER AI</span>
            </div>
            <div className="flex-1 flex flex-col gap-3 mt-8">
              <Link href="/to-dos" passHref legacyBehavior>
                <a className="text-left px-3 py-2 rounded-lg hover:bg-[#252525] text-[#f1f1f1] font-medium font-sans text-base transition-colors" onClick={() => setMobileNavOpen(false)}>
                  Dashboard
                </a>
              </Link>
              <Link href="/to-dos/calendar/weekly" passHref legacyBehavior>
                <a className={`text-left px-3 py-2 rounded-[16px] font-medium font-sans text-base transition-colors flex items-center gap-2 ${pathname === "/to-dos/calendar/weekly" ? "border-l-4 border-[#3b82f6] bg-[#252525] text-[#3b82f6]" : "hover:bg-[#252525] text-[#f1f1f1]"}`} onClick={() => setMobileNavOpen(false)}>
                  📆 Weekly Calendar
                </a>
              </Link>
              <Link href="/to-dos/calendar/monthly" passHref legacyBehavior>
                <a className={`text-left px-3 py-2 rounded-[16px] font-medium font-sans text-base transition-colors flex items-center gap-2 ${pathname === "/to-dos/calendar/monthly" ? "border-l-4 border-[#3b82f6] bg-[#252525] text-[#3b82f6]" : "hover:bg-[#252525] text-[#f1f1f1]"}`} onClick={() => setMobileNavOpen(false)}>
                  🗓️ Monthly Calendar
                </a>
              </Link>
            </div>
          </nav>
        </div>
      )}
      {/* Sidebar - hidden on mobile, visible on md+ */}
      <aside className="hidden md:flex w-64 bg-[#1b1b1b] border-r border-[#2d2d2d] flex-col p-6 min-h-screen shadow-card transition-colors duration-300 antialiased">
        <div className="mb-8">
          <span className="text-2xl font-bold text-[#3b82f6] font-sans">PROMPTER AI</span>
        </div>
        <nav className="flex-1 flex flex-col gap-3">
          <div className="text-xs text-[#b0b0b0] mb-2 tracking-wide uppercase font-semibold font-sans">Folders</div>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-[#252525] text-[#f1f1f1] font-medium font-sans text-base transition-colors">Dashboard</button>
          {/* Calendar Navigation */}
          <Link href="/to-dos/calendar/weekly" passHref legacyBehavior>
            <a className={`text-left px-3 py-2 rounded-[16px] font-medium font-sans text-base transition-colors flex items-center gap-2 ${pathname === "/to-dos/calendar/weekly" ? "border-l-4 border-[#3b82f6] bg-[#252525] text-[#3b82f6]" : "hover:bg-[#252525] text-[#f1f1f1]"}`}>
              📆 Weekly Calendar
            </a>
          </Link>
          <Link href="/to-dos/calendar/monthly" passHref legacyBehavior>
            <a className={`text-left px-3 py-2 rounded-[16px] font-medium font-sans text-base transition-colors flex items-center gap-2 ${pathname === "/to-dos/calendar/monthly" ? "border-l-4 border-[#3b82f6] bg-[#252525] text-[#3b82f6]" : "hover:bg-[#252525] text-[#f1f1f1]"}`}>
              🗓️ Monthly Calendar
            </a>
          </Link>
        </nav>
        <div className="mt-auto text-xs text-[#b0b0b0]">Templates, Settings, etc.</div>
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
          <div className="flex-1 flex flex-col">
            {/* Top Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-8 md:px-10 py-4 sm:py-5 border-b border-border bg-card shadow-card">
              {/* Left: Create with AI Button */}
              <Button
                variant="default"
                className="w-full sm:w-auto flex items-center gap-2 font-semibold px-5 py-2 rounded-lg shadow-card bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
                onClick={() => setIsChatPanelOpen(true)}
              >
                <HiSparkles className="text-lg mr-1" />
                Create with AI
              </Button>

              {/* Center: Search Bar */}
              <div className="w-full sm:flex-1 flex justify-center">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full max-w-xl bg-muted text-foreground placeholder:text-muted-foreground rounded-full px-5 py-2 text-base outline-none border border-border focus:ring-2 focus:ring-ring transition"
                />
              </div>

              {/* Right: Icon Buttons for Filters and Export */}
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
            <div id="exportContent" className="flex-1 p-4 sm:p-8 md:p-12 bg-background text-foreground rounded-xl shadow-card max-w-6xl mx-auto print:max-w-full print:rounded-none print:shadow-none print:bg-white">
              <section className="mb-8 rounded-xl shadow-card bg-card text-foreground p-4 sm:p-8">
                <h2 className="text-2xl font-bold mb-6">Task Statistics</h2>
                <Stats />
              </section>
              <section className="mb-8">
                <TasksArea
                  searchQuery={searchQuery}
                  filterPriority={filterPriority}
                  filterStatus={filterStatus}
                />
              </section>
            </div>

            <Separator className="my-4 border-t border-border" />

            <TasksFooter />
          </div>
          {/* Right Chat Panel Overlay */}
          {isChatPanelOpen && (
            <>
              {/* Overlay */}
              <div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                onClick={() => setIsChatPanelOpen(false)}
              />
              {/* Side Panel */}
              <div className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col shadow-2xl bg-card border-l border-border animate-slide-in">
                {/* Close Button */}
                <button
                  className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring rounded-full transition z-50"
                  aria-label="Close AI Chat"
                  onClick={() => setIsChatPanelOpen(false)}
                >
                  ×
                </button>
                <RightPanel />
              </div>
            </>
          )}
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
