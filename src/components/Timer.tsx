"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
  label: string;
  isIndicative?: boolean;
  resetKey?: number;
}

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function Timer({
  initialSeconds,
  onTimeUp,
  label,
  isIndicative = false,
  resetKey = 0,
}: TimerProps) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [resetKey, initialSeconds]);

  useEffect(() => {
    if (seconds <= 0) {
      onTimeUp?.();
      return;
    }

    const interval = setInterval(() => {
      setSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [seconds, onTimeUp]);

  const isLow = seconds <= 60 && !isIndicative;
  const isVeryLow = seconds <= 30 && !isIndicative;

  return (
    <div
      className={`flex flex-col items-center rounded-2xl px-6 py-3 ${
        isIndicative
          ? "bg-gray-100"
          : isVeryLow
            ? "animate-pulse bg-red-100"
            : isLow
              ? "bg-orange-100"
              : "bg-indigo-100"
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span
        className={`text-2xl font-bold md:text-3xl ${
          isIndicative
            ? "text-gray-600"
            : isVeryLow
              ? "text-red-600"
              : isLow
                ? "text-orange-600"
                : "text-indigo-600"
        }`}
      >
        {formatTime(seconds)}
      </span>
    </div>
  );
}
