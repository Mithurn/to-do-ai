import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { validateRequest } from "@/app/aut";
import type { NextRequest } from "next/server";
import { db } from "@/app/db/drizzle";
import { userTable } from "@/app/db/schema";
import { eq } from "drizzle-orm";

// TypeScript types for multi-turn context and task preview
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type AITaskDraft = {
  name: string;
  description?: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "in progress" | "completed";
  due_date?: string; // ISO
  estimated_time?: number; // hours
  category?: string;
  dependencies?: string[];
};

export type AIGenerateRequest = {
  prompt: string;
  context?: ChatMessage[];
};

// --- TypeScript types for API response ---
export type AIGenerateTask = {
  name: string;
  description?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in progress' | 'completed';
  due_date?: string;
  estimated_time?: number;
  category?: string;
};

export type AIGenerateResponse = {
  success: boolean;
  clarificationNeeded: boolean;
  clarificationText?: string;
  clarifications?: string[];
  tasks?: AIGenerateTask[];
  summaryMessage?: string;
  debug?: string;
};

// Move hasCoreInfo to top-level scope
function hasCoreInfo(text: string): boolean {
  const goal = /(goal|objective|plan|project|task|learn|study|build|make|achieve|complete)/i;
  const timeline = /(day|week|month|year|deadline|timeline|schedule|by [a-z]+ \d{1,2}|\d+ (days|weeks|months|years))/i;
  const skill = /(beginner|intermediate|advanced|expert|skill level|experience|familiar|new to|proficient|novice)/i;
  const method = /(learn(ing)? (by|through|with)|prefer(red)? (method|way|approach)|video|book|course|tutorial|practice|project-based|reading|watching|hands-on|step by step)/i;
  return goal.test(text) && timeline.test(text) && skill.test(text) && method.test(text);
}

// Add a new function to check for minimum info for task generation
function hasMinimumInfo(text: string): boolean {
  const goal = /(goal|objective|plan|project|task|learn|study|build|make|achieve|complete|want to|need to|help me|how do I|how can I)/i;
  const timeframe = /(day|week|month|year|deadline|timeline|schedule|by [a-z]+ \d{1,2}|\d+ (days|weeks|months|years|hours|minutes))/i;
  const background = /(beginner|intermediate|advanced|expert|skill level|experience|familiar|new to|proficient|novice|no experience|never done|first time|no background|no prior)/i;
  // Only require background if not explicitly stated as 'no experience' or similar
  return goal.test(text) && timeframe.test(text) && (background.test(text) || /no experience|never done|first time|no background|no prior/i.test(text));
}

// Helper: Build the message array for the AI model
function buildMessages(systemPrompt: string, context: ChatMessage[], userPrompt: string) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...(context || []).map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userPrompt },
  ];
  return messages;
}

// --- System prompt for Gemini AI assistant ---
const SYSTEM_PROMPT = `You are QuickTask, a friendly, highly detail-oriented productivity assistant. Always reply in a clear, conversational, user-friendly style.\n\nInstructions:\n- If the user's prompt is ambiguous or missing important context, do NOT generate tasks yet. Instead, ask clarifying questions in a friendly, conversational way. Use bullet points for each question.\n- Never include JSON, code blocks, or technical explanations.\n- When you have enough detail, generate a well-organized, actionable, and prioritized list of tasks. Each task should have a clear title, optional description, priority (High, Medium, Low), and optional timeframe or status.\n- After the task list, include a short, encouraging summary message.\n- Always sound like a helpful human assistant.\n- Never output raw JSON or code fences.\n`;

export async function POST(req: NextRequest) {
  // TEMP DEBUG: Print env vars
  console.log('DEBUG OPENAI_API_KEY:', process.env.OPENAI_API_KEY);
  console.log('[DEBUG] /api/ai-generate: handler started');
  try {
    // Auth check
    const user = await validateRequest();
    if (!user || !user.user) {
      console.log('[DEBUG] /api/ai-generate: not authenticated');
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const userId = user.user.id;
    // Parse and validate input
    const { prompt, context }: AIGenerateRequest = await req.json();
    console.log('[DEBUG] /api/ai-generate: input parsed', { prompt, context });
    if (!prompt || typeof prompt !== "string") {
      console.log('[DEBUG] /api/ai-generate: missing or invalid prompt');
      return NextResponse.json({ error: "Missing or invalid prompt." }, { status: 400 });
    }
    // Gemini API setup
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in environment variables.");
      return NextResponse.json({ error: "AI credentials missing." }, { status: 500 });
    }
    const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    // Use the system prompt variable
    const systemPrompt = SYSTEM_PROMPT;
    const contents = [
      { role: "model", parts: [{ text: systemPrompt }] },
      { role: "user", parts: [{ text: prompt }] }
    ];
    console.log('[DEBUG] /api/ai-generate: calling Gemini', { contents });
    // Call the Gemini API with a timeout (15 seconds)
    let aiRaw = "";
    let debug = "";
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const geminiRes = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-goog-api-key": apiKey!,
        },
        body: JSON.stringify({ contents }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error("Gemini API error:", geminiRes.status, errText);
        return NextResponse.json({ error: `Gemini API error: ${geminiRes.status}` }, { status: 500 });
      }
      const geminiData = await geminiRes.json();
      aiRaw = geminiData.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      debug = JSON.stringify(geminiData, null, 2);
      console.log('[DEBUG] /api/ai-generate: Gemini response', aiRaw);
    } catch (err) {
      console.error("Error calling Gemini:", err);
      return NextResponse.json({ error: "AI call failed or timed out" }, { status: 500 });
    }
    // --- Parse Gemini's conversational response ---
    let clarificationNeeded = false;
    let clarificationText = "";
    let clarifications: string[] = [];
    let tasks: AIGenerateTask[] = [];
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
    // --- NEW: Heuristic to skip clarifications if core info is present ---
    // Check user context for core info
    let userContext = '';
    if (Array.isArray(context)) {
      userContext = context.map(m => m.content).join(' ');
    }
    const combinedText = (userContext + ' ' + prompt).toLowerCase();
    if (clarificationNeeded && hasCoreInfo(combinedText)) {
      clarificationNeeded = false;
      clarificationText = "";
      clarifications = [];
    }
    // If not clarification, try to extract tasks and summary
    if (!clarificationNeeded) {
      // Heuristic: Split into lines, look for task-like lines (numbered or bullet)
      const lines = cleaned.split('\n').map(l => l.trim()).filter(Boolean);
      let inTasks = false;
      let currentTask: Partial<AIGenerateTask> = {};
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
            tasks.push(currentTask as AIGenerateTask);
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
    // --- NEW: Check for minimum info and override clarificationNeeded if present ---
    if (clarificationNeeded && hasMinimumInfo(combinedText)) {
      clarificationNeeded = false;
      clarificationText = "";
      clarifications = [];
    }
    // If partial info is present and tasks can be reasonably inferred, default to generating tasks
    if (!clarificationNeeded && tasks.length === 0) {
      // Try to infer tasks from the prompt/context even if not all details are present
      // (This is a fallback: if the AI output didn't parse tasks but we have minimum info, try to generate a basic plan)
      // For now, just return a generic fallback task if nothing else
      tasks.push({
        name: "Start working towards your goal based on the information provided.",
        priority: 'Medium',
        status: 'pending',
      });
      summaryMessage = "Here's a basic plan to get you started!";
    }
    // --- Build and return the response ---
    if (clarificationNeeded) {
      // Never return tasks or summaryMessage with clarifications
      return NextResponse.json({
        clarificationNeeded: true,
        clarificationText: clarificationText || cleaned,
        clarifications,
        tasks: [],
        summaryMessage: undefined,
      }, { status: 200 });
    } else if (tasks.length > 0) {
      return NextResponse.json({
        clarificationNeeded: false,
        clarificationText: "",
        clarifications: [],
        tasks,
        summaryMessage: summaryMessage || "Here's a personalized plan to get you started!",
      }, { status: 200 });
    } else {
      // Fallback: couldn't parse, ask for more detail
      return NextResponse.json({
        clarificationNeeded: true,
        clarificationText: "Sorry, I couldn't generate tasks for that prompt. Could you provide more detail?",
        clarifications: [],
      }, { status: 200 });
    }
  } catch (err) {
    console.error("/api/ai-generate error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
