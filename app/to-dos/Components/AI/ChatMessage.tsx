import React from "react";
import { Avatar } from "@/components/ui/avatar";
import { HiSparkles } from "react-icons/hi2";
import { FiUser } from "react-icons/fi";

export interface ChatMessageProps {
  role: "user" | "assistant";
  text: string;
  thinking?: boolean;
}

/**
 * ChatMessage renders a single chat bubble for the AI chat panel.
 * It only handles plain text and clarifications now — tasks are shown separately.
 */
export const ChatMessage: React.FC<ChatMessageProps> = ({ role, text, thinking }) => {
  const isUser = role === "user";

  if (thinking && !isUser) {
    // Typing indicator for AI
    return (
      <div className="flex items-end justify-start mb-2">
        <Avatar className="mr-2">
          <HiSparkles className="text-xl text-blue-500" />
        </Avatar>
        <div className="max-w-[70%] rounded-2xl px-4 py-3 shadow text-base bg-muted text-foreground rounded-bl-md border border-border flex items-center gap-2">
          <span className="animate-pulse">AI is thinking...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end ${isUser ? "justify-end" : "justify-start"} mb-2`}>
      {!isUser && (
        <Avatar className="mr-2">
          <HiSparkles className="text-xl text-blue-500" />
        </Avatar>
      )}
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 shadow text-base whitespace-pre-line
          ${isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md border border-border"}
        `}
      >
        <span>{text}</span>
      </div>
      {isUser && (
        <Avatar className="ml-2 bg-gray-200">
          <FiUser className="text-xl text-gray-500" />
        </Avatar>
      )}
    </div>
  );
};
