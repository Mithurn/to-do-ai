import React from "react";

export interface ClarificationCardProps {
  clarificationText: string;
  clarifications?: string[];
  onAnswerChange?: (answers: string[]) => void;
  answers?: string[];
  loading?: boolean;
}

/**
 * ClarificationCard displays AI-generated clarifying questions in a user-friendly, styled card.
 */
export const ClarificationCard: React.FC<ClarificationCardProps> = ({
  clarificationText,
  clarifications = [],
  onAnswerChange,
  answers = [],
  loading = false,
}) => {
  return (
    <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/20 shadow-lg p-6 mb-4 transition-all border border-blue-100 dark:border-blue-800">
      <div className="text-base font-semibold text-blue-900 dark:text-blue-100 mb-2 whitespace-pre-line">
        {clarificationText}
      </div>
      {clarifications.length > 0 && (
        <form className="flex flex-col gap-3 mt-2">
          {clarifications.map((q, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <label className="text-sm font-medium text-blue-800 dark:text-blue-200">
                {q}
              </label>
              <input
                type="text"
                className="rounded-lg border border-blue-200 dark:border-blue-700 px-3 py-2 bg-white dark:bg-blue-950 text-blue-900 dark:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
                value={answers[idx] || ""}
                onChange={e => {
                  if (!onAnswerChange) return;
                  const newAnswers = [...answers];
                  newAnswers[idx] = e.target.value;
                  onAnswerChange(newAnswers);
                }}
                disabled={loading}
                placeholder="Your answer..."
              />
            </div>
          ))}
        </form>
      )}
    </div>
  );
}; 