import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "@/app/aut";

// --- Types ---
export type Task = {
  name: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "in progress" | "completed";
  due_date?: string;
  estimated_time?: number;
  category?: string;
};

export type ValidateEditedRequest = {
  tasks: Task[];
};

export type ValidateEditedResponse =
  | { valid: true; tasks: Task[] }
  | { valid: false; errors: string[] };

const VALID_PRIORITIES = ["High", "Medium", "Low"];
const VALID_STATUSES = ["pending", "in progress", "completed"];

export async function POST(req: NextRequest) {
  // --- Auth check ---
  const user = await validateRequest();
  if (!user || !user.user) {
    return NextResponse.json({ valid: false, errors: ["Not authenticated"] }, { status: 401 });
  }

  // --- Parse and validate input ---
  const { tasks }: ValidateEditedRequest = await req.json();
  if (!Array.isArray(tasks)) {
    return NextResponse.json({ valid: false, errors: ["Missing or invalid tasks array."] }, { status: 400 });
  }

  const errors: string[] = [];
  const validated: Task[] = [];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    if (!t || typeof t !== "object") {
      errors.push(`Task at index ${i} is malformed.`);
      continue;
    }
    if (!t.name || typeof t.name !== "string" || t.name.trim() === "") {
      errors.push(`Task at index ${i} has an empty or invalid name.`);
      continue;
    }
    if (!VALID_PRIORITIES.includes(t.priority)) {
      errors.push(`Task '${t.name}' has invalid priority.`);
      continue;
    }
    if (!VALID_STATUSES.includes(t.status)) {
      errors.push(`Task '${t.name}' has invalid status.`);
      continue;
    }
    // Optionally check for other fields (e.g., due_date, estimated_time)
    validated.push({
      name: t.name.trim(),
      description: t.description ? String(t.description) : undefined,
      priority: t.priority,
      status: t.status,
      due_date: t.due_date ? String(t.due_date) : undefined,
      estimated_time: typeof t.estimated_time === "number" ? t.estimated_time : undefined,
      category: t.category ? String(t.category) : undefined,
    });
  }

  if (errors.length > 0) {
    return NextResponse.json({ valid: false, errors }, { status: 400 });
  }

  return NextResponse.json({ valid: true, tasks: validated }, { status: 200 });
} 