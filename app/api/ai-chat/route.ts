import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SYSTEM_INSTRUCTION = `
You are a productivity assistant for an app called Prompt Planner.
Your purpose is to take a user's goal and break it down into a list of small, actionable tasks.
You must return the output as a JSON array of objects. Do not include any other text, explanations, or markdown formatting.
Each object in the array should represent a single task and must have the following structure:
{
  "name": "A concise and clear task title",
  "description": "A detailed, step-by-step description of what needs to be done to complete the task."
}

Example user goal: "Plan a trip to Tokyo"
Example output:
[
  {
    "name": "Research and Book Flights",
    "description": "Compare flight prices on different airlines and booking sites. Choose the best option based on price, schedule, and baggage allowance. Book the round-trip tickets."
  },
  {
    "name": "Book Accommodation",
    "description": "Research hotels, Airbnb, or hostels in different neighborhoods of Tokyo. Consider budget, location, and amenities. Book your stay for the entire duration of the trip."
  }
]
`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const latestMessage = messages[messages.length - 1];
    
    if (!latestMessage || latestMessage.role !== 'user') {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_INSTRUCTION }],
      },
        {
          role: "model",
          parts: [{ text: "Okay, I understand. I will take the user's goal and return a JSON array of actionable tasks with a 'name' and 'description'." }],
        },
      ],
    });

    const result = await chat.sendMessage(latestMessage.text);
    const responseText = result.response.text();
    
    // Clean the response to ensure it's valid JSON
    const jsonString = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    // Parse the JSON string to ensure it's valid before sending
    const tasks = JSON.parse(jsonString);

    return Response.json({ tasks });

  } catch (error: any) {
    console.error("[Gemini API] Error:", error);
    return Response.json({ error: `Error generating response: ${error?.message || error}` }, { status: 500 });
  }
}
