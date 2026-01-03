"use client";

import { useEffect, useState } from "react";

interface TimerProps {
  initialSeconds: number;
  onTimeUp?: () => void;
  label?: string;
  isIndicative?: boolean;
  resetKey?: number;
}

export default function Timer({
  initialSeconds,
  onTimeUp,
  label,
  isIndicative = false,
  resetKey = 0,
}: TimerProps) {
  const showLabel = Boolean(label);
  const [seconds, setSeconds] = useState(initialSeconds);
  const [colonVisible, setColonVisible] = useState(true);

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

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setColonVisible((v) => !v);
    }, 500);

    return () => clearInterval(blinkInterval);
  }, []);

  const isLow = seconds <= 60 && !isIndicative;
  const isVeryLow = seconds <= 30 && !isIndicative;

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  const textColorClass = isIndicative
    ? "text-gray-600"
    : isVeryLow
      ? "text-red-600"
      : isLow
        ? "text-orange-600"
        : "text-indigo-600";

  return (
    <div
      className={`flex flex-col items-center rounded-xl px-4 py-2 ${
        isIndicative
          ? "bg-gray-100"
          : isVeryLow
            ? "animate-pulse bg-red-100"
            : isLow
              ? "bg-orange-100"
              : "bg-indigo-100"
      }`}
    >
      {showLabel && (
        <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
          {label}
        </span>
      )}
      <span className={`text-2xl font-bold md:text-3xl ${textColorClass}`}>
        {hrs > 0 ? (
          <>
            {hrs}
            <span className={colonVisible ? "opacity-100" : "opacity-0"}>:</span>
            {mins.toString().padStart(2, "0")}
          </>
        ) : (
          <>
            {mins.toString().padStart(2, "0")}
            <span className={colonVisible ? "opacity-100" : "opacity-0"}>:</span>
            {(seconds % 60).toString().padStart(2, "0")}
          </>
        )}
      </span>
    </div>
  );
}
