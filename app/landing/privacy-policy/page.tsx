"use client";
import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-[#0C0C0D] text-[#F4F4F5] flex flex-col items-center py-16 px-4">
      <div className="w-full max-w-3xl mx-auto bg-[#1C1C1F] border border-[#2D2D31] rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
        <p className="mb-4 text-[#A1A1AA]">Prompter AI is a personal project built to help you manage tasks with the power of AI. Your privacy is important. Here's how your data is handled:</p>
        <ul className="list-disc pl-6 space-y-3 mb-6 text-[#A1A1AA]">
          <li>We collect task-related data and user prompts to provide and improve the service.</li>
          <li>Your tasks are stored securely in a database (SQLite or Postgres, depending on deployment).</li>
          <li>Some prompts may be sent to an external AI API to generate task suggestions or plans.</li>
          <li>We do <span className="font-semibold text-[#F4F4F5]">not</span> sell or share your personal data with third parties.</li>
          <li>You can request account deletion at any time by contacting the creator.</li>
        </ul>
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p className="mb-8 text-[#A1A1AA]">For privacy questions or account deletion, email <a href="mailto:mithurnjeromme172@gmail.com" className="text-[#3B82F6] underline">mithurnjeromme172@gmail.com</a>.</p>
        <div className="pt-4 border-t border-[#2D2D31] text-center">
          <Link href="/landing" className="text-[#3B82F6] hover:underline">← Back to Home</Link>
        </div>
      </div>
    </main>
  );
} 