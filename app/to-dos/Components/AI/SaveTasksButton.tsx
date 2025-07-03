import React from "react";
import { Button } from "@/components/ui/button";

export interface SaveTasksButtonProps {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * SaveTasksButton renders a styled button for saving AI-generated tasks.
 */
export const SaveTasksButton: React.FC<SaveTasksButtonProps> = ({ onClick, disabled, loading }) => (
  <Button
    onClick={onClick}
    disabled={disabled || loading}
    className="rounded-2xl px-6 py-2 font-semibold shadow-md bg-green-600 hover:bg-green-700 text-white transition-all text-base"
  >
    {loading ? "Saving..." : "Save Tasks"}
  </Button>
); 