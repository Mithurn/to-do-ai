import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { FiCheckCircle, FiSave } from "react-icons/fi";

export interface AITask {
  name: string;
  description: string;
}

interface AITaskCardProps {
  task: AITask;
  onSave: (task: AITask) => Promise<void>;
}

export const AITaskCard: React.FC<AITaskCardProps> = ({ task, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(task);
      setIsSaved(true);
    } catch (error) {
      console.error("Failed to save task:", error);
      // Optionally, show an error state to the user
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="mb-4 bg-muted/50 border-border transition-all">
      <CardHeader>
        <CardTitle className="text-lg">{task.name}</CardTitle>
        <CardDescription className="pt-2 whitespace-pre-line">{task.description}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={isSaving || isSaved}
          variant={isSaved ? "secondary" : "default"}
          className="flex items-center gap-2"
        >
          {isSaved ? (
            <>
              <FiCheckCircle /> Saved
            </>
          ) : isSaving ? (
            "Saving..."
          ) : (
            <>
              <FiSave /> Save Task
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}; 