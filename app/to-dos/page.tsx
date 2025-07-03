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

export default function Dashboard() {
  const router = useRouter();
  const { user, validateUser } = useUserStore();
  const { addNewTask, setIsTaskDialogOpened, setLastAIPrompt, lastAIPrompt, deleteTaskFunction, setTasks, setTaskSelected } = useTasksStore();
  const { tasks } = useTasksStore(); // <-- Add this line

  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "👋 Hi! What would you like help with today?" }
  ]);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [pendingTasks, setPendingTasks] = useState<AITask[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

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
  // const [showAiInput, setShowAiInput] = useState(false);
  // const [showInput, setShowInput] = useState(true);
  const [showOutput, setShowOutput] = useState(true);
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false);

  // Add a debug state to store the last AI debug output
  const [lastAIDebug, setLastAIDebug] = useState<string | null>(null);

  // Add a debug log for pendingTasks whenever it changes
  useEffect(() => {
    if (pendingTasks.length > 0) {
      // eslint-disable-next-line no-console
      console.log("[DEBUG] pendingTasks:", pendingTasks);
    }
  }, [pendingTasks]);

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
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (data && data.tasks) {
        setAiTasks(data.tasks); // assuming data.tasks is an array of task strings
        setLastAIPrompt(prompt);
      } else {
        console.error("Invalid response from AI:", data);
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
    } finally {
      setLoading(false);
      setPrompt("");
    }
  };

  // Save AI Tasks into Task Store
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
        priority: (task.priority || "medium") as "high" | "medium" | "low", // ✅ Fix here
        dueDate: new Date().toISOString(),
        startTime: task.startTime,
        endTime: task.endTime,
      };

      await addNewTask(newTask);
    }

    setAiTasks([]);
    setPrompt("");
    setIsPromptPanelOpen(false); // ✅ Close AI Panel
  };

  // Chat send handler (multi-turn clarification support)
  const handleSendPrompt = async () => {
    if (!pendingPrompt.trim()) return;
    const userMsg = { role: "user", content: pendingPrompt };
    const newContext = [...messages, userMsg];
    setMessages(newContext);
    setPendingLoading(true);
    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: pendingPrompt,
          context: newContext,
        }),
      });
      const data = await response.json();
      setLastAIDebug(data.debug || null);
      if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
        setPendingTasks(data.tasks);
        setMessages((msgs) => [
          ...newContext,
          { role: "assistant", content: `Here are some tasks I generated for you:` }
        ]);
      } else if (data && data.clarification) {
        setPendingTasks([]);
        setMessages((msgs) => [
          ...newContext,
          { role: "assistant", content: data.clarification }
        ]);
      } else {
        setPendingTasks([]);
        setMessages((msgs) => [
          ...newContext,
          { role: "assistant", content: `Sorry, I couldn't generate tasks for that prompt.` }
        ]);
      }
    } catch (error) {
      setPendingTasks([]);
      setMessages((msgs) => [
        ...newContext,
        { role: "assistant", content: `Error generating tasks. Please try again.` }
      ]);
    } finally {
      setPendingLoading(false);
      setPendingPrompt("");
    }
  };

  // Regenerate handler (re-sends last user prompt with context)
  const handleRegenerateChat = async () => {
    const lastUserMsg = [...messages].reverse().find((msg) => msg.role === "user");
    if (!lastUserMsg) return;
    setPendingLoading(true);
    try {
      const response = await fetch("/api/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: lastUserMsg.content,
          context: messages,
        }),
      });
      const data = await response.json();
      setLastAIDebug(data.debug || null);
      if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
        setPendingTasks(data.tasks);
        setMessages((msgs) => [
          ...messages,
          { role: "assistant", content: `Here is a regenerated set of tasks:` }
        ]);
      } else if (data && data.clarification) {
        setPendingTasks([]);
        setMessages((msgs) => [
          ...messages,
          { role: "assistant", content: data.clarification }
        ]);
      } else {
        setPendingTasks([]);
        setMessages((msgs) => [
          ...messages,
          { role: "assistant", content: `Sorry, I couldn't generate tasks for that prompt.` }
        ]);
      }
    } catch (error) {
      setPendingTasks([]);
      setMessages((msgs) => [
        ...messages,
        { role: "assistant", content: `Error generating tasks. Please try again.` }
      ]);
    } finally {
      setPendingLoading(false);
    }
  };

  // Save tasks from chat to dashboard
  const handleSaveChatTasks = async () => {
    if (pendingTasks.length === 0) return;
    setPendingLoading(true);
    try {
      const response = await fetch("/api/tasks/save-generated", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks: pendingTasks }),
      });
      const data = await response.json();
      setLastAIDebug(data.debug || null);
      if (response.ok && data.tasks) {
        setTasks([...tasks, ...data.tasks]);
        setMessages((msgs) => [
          ...msgs,
          { role: "assistant", content: `✅ Tasks saved to your dashboard!` }
        ]);
        toast({ title: "Tasks saved!", description: "Your AI-generated tasks have been added to your dashboard." });
        setIsPromptPanelOpen(false);
      } else if (data.error === "Not authenticated") {
        toast({ title: "Login required", description: "Please sign in to save tasks to your dashboard.", variant: "destructive" });
      } else {
        toast({ title: "Error", description: data.error || "Failed to save tasks.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to save tasks.", variant: "destructive" });
    } finally {
      setPendingLoading(false);
      setPendingTasks([]);
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

  // Mark a task as complete
  const handleCompleteTask = (taskId: string) => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: "completed" as "completed" } : task
    );
    setTasks(updatedTasks);
    toast({ title: "Task completed!", description: "Great job!" });
  };

  // Edit a task (for simplicity, just prompt for new name)
  const handleEditTask = (taskId: string) => {
    const editedName = prompt("Edit task name:", tasks.find((t) => t.id === taskId)?.name || "");
    if (editedName) {
      const updatedTasks = tasks.map(t =>
        t.id === taskId ? { ...t, name: editedName, status: t.status as "in progress" | "completed" } : t
      );
      setTasks(updatedTasks);
      toast({ title: "Task updated!", description: "Your task was updated." });
    }
  };

  // Delete a task
  const handleDeleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
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
          <Link href="/to-dos/calendar">
            <button className="text-left px-3 py-2 rounded-lg hover:bg-accent/30 text-primary font-medium font-sans text-base transition-colors">
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
            {/* Close Button */}
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-destructive text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-ring rounded-full transition"
              aria-label="Close AI Input"
              onClick={() => setIsPromptPanelOpen(false)}
            >
              ×
            </button>

            {/* Chat Panel Content */}
            <div className="flex flex-col h-full pt-12">
              {/* Header */}
              <div className="pb-4 border-b border-border">
                <h2 className="text-xl font-semibold">AI Task Assistant</h2>
                <p className="text-sm text-muted-foreground">Chat with AI to generate tasks and plans</p>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-2 ${msg.role === "user" ? "flex justify-end" : "flex justify-start"}`}
                  >
                    <div
                      className={`max-w-xs rounded-lg p-3 ${msg.role === "user" ? "bg-primary text-primary-foreground ml-auto" : "bg-muted"}`}
                    >
                      {msg.content}
                      {/* Show debug output below the last AI message in development mode */}
                      {process.env.NODE_ENV === "development" && msg.role === "assistant" && idx === messages.length - 1 && lastAIDebug && (
                        <div className="mt-2 text-xs text-gray-400 border-t pt-2">
                          <strong>AI debug:</strong> <pre className="whitespace-pre-wrap">{lastAIDebug}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {/* Always show tasks if present, regardless of chat message order */}
                {pendingTasks.length > 0 && (
                  <motion.div
                    className="bg-muted p-3 rounded-lg max-w-xs mt-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="font-semibold mb-2">AI Suggested Tasks</div>
                    {/* Show a visible message if fallback was used */}
                    {lastAIDebug && lastAIDebug.includes('[FALLBACK STATIC TASKS USED]') && (
                      <div className="mb-2 text-xs text-yellow-600 font-semibold">(Fallback plan shown due to AI error)</div>
                    )}
                    <ol className="list-decimal pl-5 space-y-2">
                      {pendingTasks.map((task, idx) => (
                        <motion.li
                          key={task.id || idx}
                          className="flex items-center gap-2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          {/* Priority badge */}
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-semibold
                              ${task.priority === "high" ? "bg-red-500 text-white" :
                                task.priority === "medium" ? "bg-yellow-400 text-black" :
                                "bg-green-500 text-white"}
                            `}
                          >
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </span>
                          <span>{task.name}</span>
                          {/* Status icon */}
                          {task.status === "in progress" && <span className="text-xs text-blue-500 ml-2">⏳</span>}
                          {task.status === "completed" && <span className="text-xs text-green-500 ml-2">✔️</span>}
                        </motion.li>
                      ))}
                    </ol>
                    {/* Encouragement message */}
                    <div className="mt-3 text-sm text-green-700 font-medium">
                      Good luck! Practice a little each day and you'll see progress fast. 🎸<br />
                      Remember: Consistency beats intensity. You've got this!
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleRegenerateChat} disabled={pendingLoading} variant="outline">Regenerate</Button>
                      <Button onClick={async () => {
                        await handleSaveChatTasks();
                        toast({ title: "Tasks saved!", description: "Your AI-generated tasks have been added to your dashboard." });
                      }} disabled={pendingLoading || pendingTasks.length === 0} variant="default">Save to Dashboard</Button>
                    </div>
                  </motion.div>
                )}
                {pendingLoading && (
                  <div className="text-xs text-muted-foreground">AI is thinking...</div>
                )}
              </div>

              {/* Sticky Input Area */}
              <div className="pt-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    ref={aiPromptRef}
                    type="text"
                    value={pendingPrompt}
                    onChange={(e) => setPendingPrompt(e.target.value)}
                    placeholder="Type your prompt..."
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    onKeyDown={e => { if (e.key === 'Enter') handleSendPrompt(); }}
                    disabled={pendingLoading}
                  />
                  <Button
                    variant="default"
                    onClick={handleSendPrompt}
                    disabled={pendingLoading || !pendingPrompt.trim()}
                  >
                    {pendingLoading ? "..." : "→"}
                  </Button>
                </div>
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
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="Describe your plan or tasks..."
                    className="flex-1 px-4 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground"
                    disabled={loading}
                  />
                  <Button
                    variant="default"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
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
