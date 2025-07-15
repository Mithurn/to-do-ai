import React from "react";

export default function DailyCalendarPage() {
  const today = new Date();
  const dateStr = today.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex items-center justify-between px-8 py-6 border-b border-border bg-card/80 shadow-card sticky top-0 z-20">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{dateStr}</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl shadow transition-all text-base">Add New Task</button>
      </header>
      <main className="flex-1 flex flex-col items-stretch p-8">
        {/* Timeline placeholder */}
        <div className="w-full max-w-3xl mx-auto bg-card rounded-xl shadow-card p-6 min-h-[600px] h-[80vh] flex flex-col justify-stretch overflow-x-auto">
          <div className="text-center text-muted-foreground text-lg mt-32">[Daily timeline will go here]</div>
        </div>
      </main>
    </div>
  );
} 