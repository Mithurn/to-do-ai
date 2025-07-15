import React from "react";
import { AIChatPanel } from "./AIChatPanel";

export const RightPanel: React.FC = () => {
  return (
    <div className="flex flex-col h-screen max-h-screen bg-card border-l border-border w-full">
      <AIChatPanel />
    </div>
  );
}; 