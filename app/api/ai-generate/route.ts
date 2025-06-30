// import { NextResponse } from "next/server";

// export async function POST(req: Request) {
//   const { prompt } = await req.json();

//   const res = await fetch("https://api.openai.com/v1/chat/completions", {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       model: "gpt-4",
//       messages: [
//         { role: "system", content: "You are a helpful task planner AI." },
//         { role: "user", content: `Generate 5 actionable tasks based on: ${prompt}` },
//       ],
//     }),
//   });

//   const data = await res.json();
//   const aiResponse = data.choices[0].message.content;

//   return NextResponse.json({ tasks: aiResponse });
// }


// app/api/ai-generate/route.ts (Next.js App Router)
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { prompt } = await req.json();

  // Simulated response (you can customize based on prompt)
  const tasks = [
    `1. Research tools for "${prompt}"`,
    "2. Break project into small tasks",
    "3. Set daily goals",
    "4. Start working step-by-step",
    "5. Review and adjust each evening"
  ].join("\n");

  return NextResponse.json({ tasks });
}
