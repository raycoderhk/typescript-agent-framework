"use client";

import React from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type LocalToolboxStatus = "installed" | "disconnected" | "error";

export interface LocalToolboxStatusBadgeProps {
  status: LocalToolboxStatus;
  className?: string;
}

const statusConfig = {
  installed: {
    icon: CheckCircle,
    text: "Local Toolbox Connected",
    bgColor: "rgba(92, 196, 137, 0.12)",
    borderColor: "#5CC489",
    textColor: "#5CC489",
    iconColor: "#5CC489"
  },
  disconnected: {
    icon: AlertCircle,
    text: "Local Toolbox Disconnected", 
    bgColor: "rgba(247, 147, 26, 0.12)",
    borderColor: "#F7931A",
    textColor: "#F7931A",
    iconColor: "#F7931A"
  },
  error: {
    icon: AlertCircle,
    text: "Local Toolbox Error",
    bgColor: "rgba(253, 83, 83, 0.12)",
    borderColor: "#FD5353",
    textColor: "#FD5353",
    iconColor: "#FD5353"
  }
};

export function LocalToolboxStatusBadge({ 
  status, 
  className 
}: LocalToolboxStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-3 font-['Space_Grotesk'] text-xs font-normal opacity-80",
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        border: `1px solid ${config.borderColor}`,
        height: '24px',
        color: config.textColor
      }}
    >
      <Icon 
        className="w-3.5 h-3.5" 
        style={{ color: config.iconColor }}
        strokeWidth={1.2}
      />
      <span>{config.text}</span>
    </div>
  );
} 