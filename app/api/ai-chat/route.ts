// app/api/ai-chat/route.ts

import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { NextRequest } from "next/server";

const token = process.env.GITHUB_TOKEN;
const endpoint = "https://models.github.ai/inference";
const model = "openai/gpt-4.1";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    const client = ModelClient(endpoint, new AzureKeyCredential(token!));

    const response = await client.path("/chat/completions").post({
      body: {
        messages: [
          { role: "system", content: "You're an expert task planner. Help the user modify and optimize their task schedule." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        top_p: 1.0,
        model,
      },
    });

    if (isUnexpected(response)) {
      console.error("AI error:", response.body.error);
      return new Response("AI call failed", { status: 500 });
    }

    return Response.json({
      reply: response.body.choices[0].message.content,
    });

  } catch (err) {
    console.error("Request error:", err);
    return new Response("Something went wrong", { status: 500 });
  }
}
