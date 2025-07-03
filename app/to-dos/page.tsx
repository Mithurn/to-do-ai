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
import type { Task } from "../data/Tasks";

import { TaskHeader } from "./Components/TaskHeader/TaskHeader";
import Stats from "./Components/Stats/Stats";
import { TasksArea } from "./Components/TasksArea/TasksArea";
import { TasksFooter } from "./Components/TaskFooter/TaskFooter";
import { TasksDialog } from "./Components/Dialogs/TaskDialog/TaskDialog";
import { UserProfile } from "./Components/TaskHeader/UserProfile";
import { DeleteDialog } from "./Components/Dialogs/ClearAllDialog/DeleteDialog";
import TaskCalendar from './Components/TasksArea/TaskCalendar';
import { AIHeader } from "./Components/AI/AIHeader";
import { ClarificationCard } from "./Components/AI/ClarificationCard";
import { TaskList } from "./Components/AI/TaskList";
import { SaveTasksButton } from "./Components/AI/SaveTasksButton";
import { ChatMessage, ChatMessageProps, ChatMessageType } from "./Components/AI/ChatMessage";

// Update types for AI messages
export type AIMessage = {
  role: "assistant" | "user";
  type: "chat" | "tasks";
  text?: string;
  tasks?: any[];
  summaryMessage?: string;
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

  useEffect(() => {
    if (messages.length > 0 && messages[messages.length - 1].type === "tasks") {
      console.log("[DEBUG] messages:", messages);
    }
  }, [messages]);

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

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: AIMessage = { role: "user", text: input, type: "chat" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
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
      if (data.clarificationNeeded && data.clarificationText) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.clarificationText,
            type: "chat",
          },
        ]);
      } else if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "chat",
            text: data.summaryMessage || "Here is your personalized plan!",
          },
          {
            role: "assistant",
            type: "tasks",
            tasks: data.tasks,
          },
        ]);
        setEditedTasks(data.tasks);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.clarificationText || "Sorry, I couldn't generate tasks. Could you provide more detail?",
            type: "chat",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error generating tasks. Please try again.",
          type: "chat",
        },
      ]);
    }
  };

  const handleRegenerateTasks = async () => {
    setRegenerating(true);
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
      if (data.clarificationNeeded && data.clarificationText) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.clarificationText,
            type: "chat",
          },
        ]);
      } else if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            type: "chat",
            text: data.summaryMessage || "Here is your personalized plan!",
          },
          {
            role: "assistant",
            type: "tasks",
            tasks: data.tasks,
          },
        ]);
        setEditedTasks(data.tasks);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.clarificationText || "Sorry, I couldn't generate tasks. Could you provide more detail?",
            type: "chat",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Error regenerating tasks. Please try again.",
          type: "chat",
        },
      ]);
    } finally {
      setRegenerating(false);
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
          {/* <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-foreground font-medium font-sans text-base transition-colors">Favorites</button>
          <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-muted-foreground font-medium font-sans text-base transition-colors">Archived</button> */}
          <Link href="/to-dos/calendar" passHref legacyBehavior>
            <a className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-primary font-medium font-sans text-base transition-colors">
              <span role="img" aria-label="calendar"></span>Calendar View
            </a>
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
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring rounded-full transition"
              aria-label="Close AI Input"
              onClick={() => setIsPromptPanelOpen(false)}
            >
              ×
            </button>
            <div className="flex flex-col h-full pt-12">
              <AIHeader title="AI Task Assistant" subtitle="Chat with AI to generate tasks and plans" />
              <div className="flex-1 overflow-y-auto mb-4">
                {messages.map((msg, idx) => (
                  <ChatMessage
                    key={idx}
                    role={msg.role}
                    type={msg.type}
                    text={msg.text}
                    tasks={msg.type === "tasks" ? msg.tasks : undefined}
                    summaryMessage={msg.summaryMessage}
                  />
                ))}
              </div>
              {/* If the last message is a task plan, show edit/regenerate/save options */}
              {messages.length > 0 && messages[messages.length - 1].type === "tasks" && (
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex justify-between gap-2">
                    <button
                      onClick={handleRegenerateTasks}
                      disabled={regenerating}
                      className="rounded-2xl px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold transition disabled:opacity-60"
                      type="button"
                    >
                      {regenerating ? "Regenerating..." : "Regenerate"}
                    </button>
                    <SaveTasksButton onClick={handleSaveEditedTasks} disabled={regenerating} loading={regenerating} />
                  </div>
                </div>
              )}
              {/* Input always at the bottom */}
              <div className="mt-4 flex gap-2">
                <input
                  ref={aiPromptRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-lg shadow-sm"
                  onKeyDown={e => { if (e.key === 'Enter') handleSendMessage(); }}
                  disabled={regenerating}
                />
                <Button
                  variant="default"
                  onClick={handleSendMessage}
                  disabled={regenerating || !input.trim()}
                  className="rounded-2xl text-base font-semibold"
                >
                  {regenerating ? "..." : "→"}
                </Button>
              </div>
            </div>
          </div>

          {/* Top Bar */}
          <div className="flex items-center justify-between px-10 py-5 border-b border-border bg-card shadow-card">
            {/* Left: Create with AI Button */}
            <Button
              variant="default"
              className="flex items-center gap-2 font-semibold px-5 py-2 rounded-lg shadow-card bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-colors duration-200"
            onClick={() => {
              setIsPromptPanelOpen(true);
              setTimeout(() => {
                aiPromptRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                aiPromptRef.current?.focus();
              }, 300); // wait for panel to slide in
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

            {/* Inline AI Prompt UI (visible if panel is closed) */}
            {!isPromptPanelOpen && (
              <section className="mb-8 rounded-xl shadow-card bg-card text-foreground p-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <HiSparkles className="text-lg" /> Generate Tasks with AI
                </h2>
                <div className="flex gap-2 mb-4">
                  <input
                    ref={aiPromptRef}
                    type="text"
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="Describe your plan or tasks..."
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={loading}
                  />
                  <Button
                    variant="default"
                    onClick={handleGenerate}
                    disabled={loading || !aiPrompt.trim()}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </div>
                {aiTasks.length > 0 && (
                  <div className="mt-2">
                    <h3 className="font-semibold mb-2">AI Suggested Tasks</h3>
                    <ul className="list-disc list-inside text-sm mb-2">
                      {aiTasks.map((task, idx) => (
                        <li key={task.id || idx}>{task.name}</li>
                      ))}
                    </ul>
                    <Button onClick={handleSaveAITasks} className="mt-2">Save These Tasks</Button>
                  </div>
                )}
              </section>
            )}
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
        </motion.main>
      </AnimatePresence>
    </div>
  );
}
