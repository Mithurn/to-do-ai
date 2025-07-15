import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTasksStore } from "@/app/stores/useTasksStore";
import { useUserStore } from "@/app/stores/useUserStore";
import type { Task } from "@/app/data/Tasks";
import { AITaskCard, type AITask } from "./AITaskCard";
import { HiSparkles } from "react-icons/hi2";
import { toast } from "@/hooks/use-toast";

export const AIChatPanel: React.FC = () => {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedTasks, setGeneratedTasks] = useState<AITask[]>([]);
  
  const addNewTask = useTasksStore(s => s.addNewTask);
  const { user } = useUserStore();

  const handleGenerateTasks = async () => {
    if (!input.trim() || loading) return;
    
    setLoading(true);
    setError(null);
    setGeneratedTasks([]);

    try {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Pass the input as a message object to match the backend API
        body: JSON.stringify({ messages: [{ role: "user", text: input }] }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to fetch tasks from AI.");
      }

      const data = await response.json();
      setGeneratedTasks(data.tasks || []);

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTask = async (taskToSave: AITask) => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "Please sign in to save tasks.",
        variant: "destructive",
      });
      return;
    }
    try {
      const todayISO = new Date().toISOString().slice(0, 10);
      const dueDate = (taskToSave as any).due_date || todayISO;
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: taskToSave.name,
        description: taskToSave.description,
        priority: "medium",
        status: "in progress",
        userId: user.id,
        due_date: dueDate,
        startTime: dueDate, // for calendar compatibility
      };
      const result = await addNewTask(newTask);
      if (result.success) {
        toast({
          title: "Task saved",
          description: `Task '${newTask.name}' was added successfully!`,
        });
      } else {
        toast({
          title: "Error saving task",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error saving task",
        description: err.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleGenerateTasks();
  };

  return (
    <div className="flex flex-col h-full max-h-screen bg-card border-l border-border">
      {/* Input and Generate Button at the top */}
      <div className="p-4 border-b border-border bg-background flex flex-col gap-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <HiSparkles className="text-primary" />
          AI Task Generator
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter a goal, and the AI will break it down into actionable tasks for you.
        </p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            className="flex-1 px-4 py-3 rounded-2xl border border-input bg-background text-foreground placeholder:text-muted-foreground text-base shadow-sm"
            placeholder="e.g., Prepare for my MET exams"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleInputKeyDown}
            disabled={loading}
          />
          <Button
            variant="default"
            onClick={handleGenerateTasks}
            disabled={!input.trim() || loading}
            className="rounded-2xl text-base font-semibold"
          >
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </div>
      
      {/* Task List Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading && <p className="text-center text-muted-foreground">Generating tasks...</p>}
        {error && <p className="text-center text-destructive">{error}</p>}
        
        {!loading && !error && generatedTasks.length === 0 && (
           <div className="text-center text-muted-foreground mt-8">
             Your generated tasks will appear here.
           </div>
        )}

        {generatedTasks.map((task, idx) => (
          <AITaskCard key={idx} task={task} onSave={handleSaveTask} />
        ))}
      </div>
    </div>
  );
}; 