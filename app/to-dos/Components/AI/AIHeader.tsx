import React from "react";

export interface AIHeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * AIHeader displays a friendly heading and optional subtitle for the AI assistant panel.
 */
export const AIHeader: React.FC<AIHeaderProps> = ({ title, subtitle }) => (
  <div className="mb-4">
    <h2 className="text-2xl font-bold text-primary mb-1">{title}</h2>
    {subtitle && <p className="text-base text-muted-foreground">{subtitle}</p>}
  </div>
); 