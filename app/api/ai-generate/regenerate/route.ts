import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { validateRequest } from "@/app/aut";

// --- Types ---
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type Task = {
  name: string;
  description?: string;
  priority: "High" | "Medium" | "Low";
  status: "pending" | "in progress" | "completed";
  due_date?: string;
  estimated_time?: number;
  category?: string;
};

export type RegenerateRequest = {
  prompt: string;
  context?: ChatMessage[];
  regenerationId?: string;
};

export type RegenerateResponse = {
  clarificationNeeded: boolean;
  clarificationText?: string;
  clarifications?: string[];
  tasks?: Task[];
  summaryMessage?: string;
  regenerationId: string;
};

// --- System prompt (reuse from main route for consistency) ---
const SYSTEM_PROMPT = `You are QuickTask, a friendly, highly detail-oriented productivity assistant. Always reply in a clear, conversational, user-friendly style.\n\nInstructions:\n- If the user's prompt is ambiguous or missing important context, do NOT generate tasks yet. Instead, ask clarifying questions in a friendly, conversational way. Use bullet points for each question.\n- Never include JSON, code blocks, or technical explanations.\n- When you have enough detail, generate a well-organized, actionable, and prioritized list of tasks. Each task should have a clear title, optional description, priority (High, Medium, Low), and optional timeframe or status.\n- After the task list, include a short, encouraging summary message.\n- Always sound like a helpful human assistant.\n- Never output raw JSON or code fences.\n`;

export async function POST(req: NextRequest) {
  // --- Auth check ---
  const user = await validateRequest();
  if (!user || !user.user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // --- Parse and validate input ---
  const { prompt, context, regenerationId }: RegenerateRequest = await req.json();
  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing or invalid prompt." }, { status: 400 });
  }

  // --- Prepare Gemini API call ---
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "AI credentials missing." }, { status: 500 });
  }
  const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  const contents = [
    { role: "model", parts: [{ text: SYSTEM_PROMPT }] },
    { role: "user", parts: [{ text: prompt }] }
  ];

  // --- Call Gemini API ---
  let aiRaw = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const geminiRes = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 500 });
    }
    const geminiData = await geminiRes.json();
    aiRaw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  } catch (err) {
    return NextResponse.json({ error: "AI call failed or timed out" }, { status: 500 });
  }

  // --- Parse Gemini's conversational response (reuse logic from main route) ---
  let clarificationNeeded = false;
  let clarificationText = "";
  let clarifications: string[] = [];
  let tasks: Task[] = [];
  let summaryMessage = "";
  // Remove code block markers if present (defensive)
  let cleaned = aiRaw.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  }
  // Heuristic: If the response asks for clarification, extract questions
  const clarificationKeywords = [
    "can you tell me more",
    "could you clarify",
    "to help you best",
    "could you provide",
    "help me understand",
    "clarify",
    "a few questions",
    "before I can generate tasks"
  ];
  const lower = cleaned.toLowerCase();
  clarificationNeeded = clarificationKeywords.some(k => lower.includes(k));
  // Extract bullet point questions (lines starting with •, -, or *)
  const bulletRegex = /^[•\-*]\s*(.+)$/gm;
  let match;
  while ((match = bulletRegex.exec(cleaned)) !== null) {
    clarifications.push(match[1].trim());
  }
  if (clarificationNeeded && clarifications.length > 0) {
    clarificationText = cleaned;
  }
  // If not clarification, try to extract tasks and summary
  if (!clarificationNeeded) {
    // Heuristic: Split into lines, look for task-like lines (numbered or bullet)
    const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
    let inTasks = false;
    let currentTask: Partial<Task> = {};
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Start of task list
      if (/^(\d+\.|[-•*])\s+/.test(line)) {
        inTasks = true;
        // Extract task title and optional description/priority
        const taskMatch = /^(\d+\.|[-•*])\s+(.+?)(?:\s*\((High|Medium|Low)\))?(?:\s*-\s*(.+))?$/.exec(line);
        if (taskMatch) {
          currentTask = {
            name: taskMatch[2].trim(),
            priority: (taskMatch[3] as 'High' | 'Medium' | 'Low') || 'Medium',
            description: taskMatch[4]?.trim() || undefined,
            status: 'pending',
          };
          tasks.push(currentTask as Task);
        } else {
          // Fallback: just use the line as the task name
          tasks.push({ name: line.replace(/^(\d+\.|[-•*])\s+/, ''), priority: 'Medium', status: 'pending' });
        }
      } else if (inTasks && line && !/^(\d+\.|[-•*])\s+/.test(line)) {
        // If in task list, treat as description for previous task
        if (tasks.length > 0) {
          tasks[tasks.length - 1].description = (tasks[tasks.length - 1].description ? tasks[tasks.length - 1].description + ' ' : '') + line;
        }
      } else if (inTasks && line === '') {
        // End of task list
        inTasks = false;
      }
    }
    // Try to find a summary message (last non-task paragraph)
    if (tasks.length > 0) {
      const lastTaskLine = lines.findIndex(l => l.includes(tasks[tasks.length - 1].name));
      summaryMessage = lines.slice(lastTaskLine + 1).join(' ').trim();
    }
  }

  // --- Generate a new regenerationId ---
  const newRegenerationId = uuidv4();

  // --- Slightly vary the summary message for regeneration ---
  if (tasks.length > 0) {
    summaryMessage = summaryMessage || "Here's another approach you can try!";
    if (!summaryMessage.toLowerCase().includes("another")) {
      summaryMessage = summaryMessage + " (Regenerated)";
    }
  }

  // --- Build and return the response ---
  if (clarificationNeeded) {
    return NextResponse.json({
      clarificationNeeded: true,
      clarificationText: clarificationText || cleaned,
      clarifications,
      regenerationId: newRegenerationId,
    }, { status: 200 });
  } else if (tasks.length > 0) {
    return NextResponse.json({
      clarificationNeeded: false,
      clarificationText: "",
      clarifications: [],
      tasks,
      summaryMessage,
      regenerationId: newRegenerationId,
    }, { status: 200 });
  } else {
    // Fallback: couldn't parse, ask for more detail
    return NextResponse.json({
      clarificationNeeded: true,
      clarificationText: "Sorry, I couldn't generate tasks for that prompt. Could you provide more detail?",
      clarifications: [],
      regenerationId: newRegenerationId,
    }, { status: 200 });
  }
} 