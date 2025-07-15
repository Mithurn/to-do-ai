import { NextResponse } from "next/server";
import { db } from "@/app/db/drizzle";
import { tasksTable } from "@/app/db/schema";
import { v4 as uuidv4 } from "uuid";
import { validateRequest } from "@/app/aut";
import { eq } from "drizzle-orm";

// --- Types ---
type TaskInput = {
  id?: string;
  name: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "in progress" | "completed";
  due_date?: string;
  estimated_time?: number;
  category?: string;
  userId?: string;
  source?: string;
  prompt?: string;
  regenerationId?: string;
};

// Helper to map priority to DB enum
function toDbPriority(p: "High" | "Medium" | "Low"): "low" | "medium" | "high" {
  if (p === "High") return "high";
  if (p === "Medium") return "medium";
  if (p === "Low") return "low";
  return "medium";
}

export async function POST(req: Request) {
  try {
    // --- Auth check ---
    const user = await validateRequest();
    if (!user || !user.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = user.user.id;

    // --- Parse and validate input ---
    const { tasks, source = "ai", prompt, regenerationId } = await req.json();
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return NextResponse.json({ error: "No tasks provided" }, { status: 400 });
    }

    // --- Validate and normalize each task ---
    const VALID_PRIORITIES = ["High", "Medium", "Low"];
    const VALID_STATUSES = ["pending", "in progress", "completed"];
    const toInsert = tasks.map((task: TaskInput) => {
      if (!task.name || typeof task.name !== "string" || task.name.trim() === "") {
        throw new Error("Task name is required and cannot be empty.");
      }
      if (!VALID_PRIORITIES.includes(task.priority)) {
        throw new Error(`Task '${task.name}' has invalid priority.`);
      }
      if (!VALID_STATUSES.includes(task.status)) {
        throw new Error(`Task '${task.name}' has invalid status.`);
      }
      return {
        id: task.id || uuidv4(),
        name: task.name.trim(),
        description: task.description ? String(task.description) : undefined,
        priority: toDbPriority(task.priority),
        status: task.status,
        userId: userId,
        due_date: task.due_date ? String(task.due_date) : undefined,
        estimated_time: task.estimated_time ? String(task.estimated_time) : undefined,
        category: task.category ? String(task.category) : undefined,
        source: task.source || source,
        prompt: task.prompt || prompt,
        regenerationId: task.regenerationId || regenerationId,
        // createdAt/updatedAt handled by DB defaults
      };
    });

    // --- Insert all tasks ---
    const result = await db.insert(tasksTable).values(toInsert).returning();
    return NextResponse.json({ success: true, tasks: result });
  } catch (error: any) {
    console.error("Error saving generated tasks:", error);
    return NextResponse.json({ error: error.message || "Failed to save tasks" }, { status: 500 });
  }
} 