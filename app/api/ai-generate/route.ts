import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

// TypeScript types for multi-turn context and task preview
export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type TaskPreview = {
  name: string;
  priority: "low" | "medium" | "high";
  status: "in progress" | "completed";
  startTime?: string;
  endTime?: string;
};

// Helper: Build the message array for the AI model
function buildMessages(systemPrompt: string, context: ChatMessage[], userPrompt: string) {
  const messages = [
    { role: "system", content: systemPrompt },
    ...(context || []).map(m => ({ role: m.role, content: m.content })),
    { role: "user", content: userPrompt },
  ];
  return messages;
}

export async function POST(req: Request) {
  try {
    const { prompt, context } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt." }, { status: 400 });
    }

    // Azure AI setup
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      console.error("GITHUB_TOKEN is not set in environment variables.");
      return NextResponse.json({ error: "AI credentials missing." }, { status: 500 });
    }
    const endpoint = "https://models.github.ai/inference";
    const model = "openai/gpt-4.1";
    const client = ModelClient(endpoint, new AzureKeyCredential(token));

    // Even more explicit system prompt for reliability
    const systemPrompt = `You are an expert productivity assistant. Your job is to help users break down their goals into small, specific, actionable tasks for either today or this week.\n\nIf the user's request is ambiguous or missing details, reply with a single, clear clarifying question (as plain text, not JSON).\n\nIf the request is clear, ALWAYS return ONLY a JSON array of 3-7 tasks. Each task must have: name, priority (low|medium|high), status (in progress|completed), and optionally startTime and endTime (ISO 8601).\n\nExample:\n[\n  { \"name\": \"Practice basic chords\", \"priority\": \"medium\", \"status\": \"in progress\" },\n  { \"name\": \"Watch a beginner guitar lesson video\", \"priority\": \"medium\", \"status\": \"in progress\" }\n]\n\nIf you are able to generate tasks, DO NOT include any explanation, apology, or extra text, ONLY the JSON array.\nIf you need clarification, DO NOT return JSON, just the question.\nIf the user says something unrelated to planning, politely ask them to describe a goal or plan they want help with.\nNEVER apologize or explain your reasoning. NEVER return anything except a JSON array or a plain text question.`;

    // Build messages array for the AI
    const messages = buildMessages(systemPrompt, context || [], prompt);

    // Call the AI model
    let response;
    try {
      response = await client.path("/chat/completions").post({
        body: {
          messages,
          temperature: 0.7,
          top_p: 1.0,
          model,
        },
      });
    } catch (err) {
      console.error("Error calling Azure AI:", err);
      return NextResponse.json({ error: "AI call failed (network or auth error)" }, { status: 500 });
    }

    if (isUnexpected(response)) {
      console.error("AI error:", response.body.error);
      return NextResponse.json({ error: "AI call failed" }, { status: 500 });
    }

    const aiRaw = response.body.choices[0].message.content ?? "";
    console.log("AI raw response:", aiRaw);

    // Try to parse as JSON (tasks). If fails, treat as clarification or fallback.
    let tasks: TaskPreview[] = [];
    let clarification: string | null = null;
    let debug = aiRaw;
    try {
      const parsed = JSON.parse(aiRaw);
      if (Array.isArray(parsed)) {
        // Validate and normalize tasks
        tasks = parsed.map((task: any) => ({
          name: String(task.name),
          priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "medium",
          status: ["in progress", "completed"].includes(task.status) ? task.status : "in progress",
          startTime: task.startTime,
          endTime: task.endTime,
        }));
      } else {
        clarification = aiRaw;
      }
    } catch (e) {
      // If the AI returned a plain string, treat as clarification if it looks like a question
      if (aiRaw && (aiRaw.trim().endsWith("?") || aiRaw.toLowerCase().includes("what"))) {
        clarification = aiRaw;
      } else {
        // Fallback: generic clarification
        clarification = "Can you clarify your goal or what you want to accomplish?";
      }
    }
    // If neither tasks nor clarification, return a static fallback for user experience
    if (!tasks.length && !clarification) {
      tasks = [
        { name: "Research beginner guitar chords", priority: "medium", status: "in progress" },
        { name: "Practice chord transitions for 20 minutes", priority: "high", status: "in progress" },
        { name: "Watch a YouTube lesson on strumming", priority: "medium", status: "in progress" },
        { name: "Learn a simple song (e.g., 'Knockin' on Heaven's Door')", priority: "medium", status: "in progress" },
        { name: "Record yourself and review progress", priority: "low", status: "in progress" }
      ];
      debug += "\n[FALLBACK STATIC TASKS USED]";
    }
    // Always include debug info for frontend troubleshooting
    if (clarification) {
      return NextResponse.json({ clarification, debug });
    } else {
      return NextResponse.json({ tasks, debug });
    }
  } catch (err) {
    console.error("/api/ai-generate error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
