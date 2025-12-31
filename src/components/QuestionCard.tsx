"use client";

import { Question } from "@/lib/types";

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
}

const answerLabels = ["A", "B", "C", "D"];

export default function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
}: QuestionCardProps) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl bg-white p-6 shadow-lg md:p-8">
        <h2 className="text-center text-2xl font-bold text-gray-800 md:text-3xl">
          {question.question}
        </h2>
        {question.svg && (
          <div
            className="mt-6 flex justify-center"
            dangerouslySetInnerHTML={{ __html: question.svg }}
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {question.answers.map((answer, index) => (
          <button
            key={index}
            onClick={() => onSelectAnswer(index)}
            className={`flex items-center gap-4 rounded-2xl p-5 text-left text-lg font-medium transition-all duration-200 active:scale-95 md:p-6 md:text-xl ${
              selectedAnswer === index
                ? "bg-indigo-600 text-white shadow-lg ring-4 ring-indigo-300"
                : "bg-white text-gray-700 shadow-md hover:bg-indigo-50 hover:shadow-lg"
            }`}
          >
            <span
              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-lg font-bold md:h-12 md:w-12 ${
                selectedAnswer === index
                  ? "bg-white text-indigo-600"
                  : "bg-indigo-100 text-indigo-600"
              }`}
            >
              {answerLabels[index]}
            </span>
            <span>{answer}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
