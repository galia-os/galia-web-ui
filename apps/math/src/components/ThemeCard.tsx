"use client";

import { Theme } from "@/lib/types";

interface ThemeCardProps {
  theme: Theme;
  onClick: () => void;
}

export default function ThemeCard({ theme, onClick }: ThemeCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center justify-center gap-4 rounded-3xl bg-white p-8 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95 md:p-12"
    >
      <span className="text-6xl md:text-7xl">{theme.icon}</span>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800 md:text-2xl">
          {theme.name}
        </h2>
        <p className="mt-2 text-sm text-gray-500 md:text-base">
          {theme.description}
        </p>
        <p className="mt-3 text-sm font-medium text-indigo-600 md:text-base">
          {theme.questionCount} questions
        </p>
      </div>
    </button>
  );
}
