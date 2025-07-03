import React from "react";
import { TaskList } from "./TaskList";
import type { TaskPreviewCardProps } from "./TaskPreviewCard";

export type ChatMessageType = "chat" | "tasks" | "error";

export interface ChatMessageProps {
  role: "user" | "assistant";
  type: ChatMessageType;
  text?: string;
  tasks?: TaskPreviewCardProps[];
  summaryMessage?: string;
  clarifications?: string[];
}

/**
 * ChatMessage renders a single chat bubble for the AI chat panel.
 * Only type==='tasks' renders the TaskList (task container). All others are plain chat bubbles.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ role, text, type, tasks, summaryMessage, clarifications }) => {
  const isUser = role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 shadow text-base whitespace-pre-line
          ${isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : type === "error"
              ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800"
              : "bg-muted text-foreground rounded-bl-md border border-border"}
        `}
      >
        {/* Only render TaskList for finalized plan (type==='tasks') */}
        {type === "tasks" && tasks ? (
          <>
            {summaryMessage && <div className="mb-2 font-semibold text-green-700 dark:text-green-300">{summaryMessage}</div>}
            <TaskList tasks={tasks} />
          </>
        ) : null}
        {/* Chat message: normal or clarification, just plain chat bubble */}
        {type === "chat" && (
          <>
            <span>{text}</span>
            {Array.isArray(clarifications) && clarifications.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-base">
                {clarifications.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            )}
          </>
        )}
        {/* Error message: just plain chat bubble */}
        {type === "error" && <span>{text}</span>}
      </div>
    </div>
  );
}; 