"use client";
import Link from "next/link";

export default function TermsOfUse() {
  return (
    <main className="min-h-screen bg-[#0C0C0D] text-[#F4F4F5] flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-3xl mx-auto bg-[#1C1C1F] border border-[#2D2D31] rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Terms of Use</h1>
        <p className="mb-4 text-[#A1A1AA]">Prompter AI is an early-stage, personal AI-powered task manager. By using this app, you agree to the following terms:</p>
        <ul className="list-disc pl-6 space-y-3 mb-6 text-[#A1A1AA]">
          <li>No guarantee of uptime, availability, or accuracy is provided.</li>
          <li>AI-generated responses may be incorrect, incomplete, or biased.</li>
          <li>You are responsible for how you use any task outputs or suggestions.</li>
          <li>Prompt and task data may be collected and stored to improve functionality.</li>
          <li>Abuse, spam, or scraping of the service is strictly prohibited.</li>
        </ul>
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="mb-8 text-[#A1A1AA]">For questions about these terms, email <a href="mailto:mithurnjeromme172@gmail.com" className="text-[#3B82F6] underline">mithurnjeromme172@gmail.com</a>.</p>
        <div className="pt-4 border-t border-[#2D2D31] text-center">
          <Link href="/landing" className="text-[#3B82F6] hover:underline">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
} 