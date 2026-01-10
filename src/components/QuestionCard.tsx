"use client";

import { useRef } from "react";
import { Question } from "@/lib/types";
import MathText from "./MathText";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number, isTouch: boolean) => void;
  confirming?: boolean;
}

const answerLabels = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  confirming = false,
}: QuestionCardProps) {
  const wasTouchRef = useRef(false);

  const handleTouchEnd = (index: number) => {
    wasTouchRef.current = true;
    onSelectAnswer(index, true);
  };

  const handleClick = (index: number) => {
    // If this click was triggered by a touch, ignore it (touchend already handled it)
    if (wasTouchRef.current) {
      wasTouchRef.current = false;
      return;
    }
    onSelectAnswer(index, false);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-center text-2xl font-bold text-gray-800 md:text-3xl">
          <MathText text={question.question} />
        </h2>
        {question.svg && (
          <div
            className="mt-6 flex justify-center"
            dangerouslySetInnerHTML={{ __html: question.svg }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {question.answers.map((answer, index) => {
          const isSelected = selectedAnswer === index;
          const isConfirming = isSelected && confirming;

          return (
            <button
              key={index}
              onTouchEnd={() => handleTouchEnd(index)}
              onClick={() => handleClick(index)}
              disabled={confirming}
              className={`flex items-center gap-4 rounded-2xl p-5 text-left text-lg font-medium transition-all duration-200 active:scale-95 md:p-6 md:text-xl ${
                isConfirming
                  ? "scale-105 bg-indigo-700 text-white shadow-xl ring-4 ring-indigo-400 animate-pulse"
                  : isSelected
                    ? "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-300"
                    : "bg-white text-gray-700 shadow-md hover:bg-indigo-50 hover:shadow-lg"
              }`}
            >
              <span
                className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold md:h-12 md:w-12 ${
                  isSelected
                    ? "bg-white text-indigo-600"
                    : "bg-indigo-100 text-indigo-600"
                }`}
              >
                {answerLabels[index]}
              </span>
              <MathText text={answer} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
