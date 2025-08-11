import React from "react";
import { cn } from "@/lib/utils";

interface TaskStep {
  id: string;
  title: string;
  status: "pending" | "in-progress" | "completed";
}

interface TaskListProps {
  steps: TaskStep[];
  className?: string;
}

export function TaskList({ steps, className }: TaskListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Vertical lines connecting steps */}
      <div className="relative space-y-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center gap-3 relative">
            {/* Vertical line */}
            {index < steps.length - 1 && (
              <div className="absolute left-3 top-6 w-px h-4 bg-[#EDF0F5]" />
            )}
            
            {/* Step indicator */}
            <div className="flex-shrink-0">
              <div className="w-6 h-6 rounded-full bg-gradient-to-b from-[#7849EF] to-[#326CDB] border border-[rgba(255,255,255,0.2)] flex items-center justify-center">
                {step.status === "completed" && (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 14 14" fill="none">
                    <path 
                      d="M2.33 7L5.67 10.33L11.67 4.33" 
                      stroke="white" 
                      strokeWidth="1" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {step.status === "in-progress" && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                )}
                {step.status === "pending" && (
                  <div className="w-2 h-2 bg-white/50 rounded-full" />
                )}
              </div>
            </div>
            
            {/* Step content */}
            <div className="flex-1 min-w-0">
              <span 
                className={cn(
                  "text-xs",
                  step.status === "completed" ? "text-white" : "text-white/80"
                )}
              >
                {step.title}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Default export with sample steps for the design
export function ChatTaskList({ className }: { className?: string }) {
  const defaultSteps: TaskStep[] = [
    {
      id: "1",
      title: "Preparing agent to Fetch Website Data",
      status: "completed"
    },
    {
      id: "2", 
      title: "Getting high on caffeine...",
      status: "completed"
    },
    {
      id: "3",
      title: "Coming up with instructions...", 
      status: "completed"
    }
  ];

  return <TaskList steps={defaultSteps} className={className} />;
} 