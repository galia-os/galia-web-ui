"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { QuizResult, User } from "@/lib/types";

const answerLabels = ["A", "B", "C", "D"];

function formatTime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

export default function ResultsPage() {
  const router = useRouter();
  const [result, setResult] = useState<QuizResult | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedResult = sessionStorage.getItem("quizResult");
    if (!storedResult) {
      router.push("/");
      return;
    }

    const parsedResult = JSON.parse(storedResult);
    setResult(parsedResult);

    // Load users to get the user info
    fetch("/api/users")
      .then((res) => res.json())
      .then((users) => {
        const foundUser = users.find((u: User) => u.id === parsedResult.userId);
        setUser(foundUser || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📊</div>
          <p className="text-xl text-gray-600">Loading results...</p>
        </div>
      </div>
    );
  }
  const percentage = Math.round((result.score / result.questions.length) * 100);
  const avgTime =
    result.answerTimes && result.answerTimes.length > 0
      ? (result.answerTimes.reduce((a, b) => a + b, 0) / result.questions.length).toFixed(1)
      : "N/A";

  const emoji =
    percentage >= 90
      ? "🏆"
      : percentage >= 70
        ? "🌟"
        : percentage >= 50
          ? "👍"
          : "💪";

  return (
    <div className="min-h-screen p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 text-center">
        {user && (
          <div className="mb-4 flex items-center justify-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-white ${user.bgColor}`}
            >
              {user.id}
            </span>
            <span className="text-2xl font-semibold text-gray-700">
              {user.name}&apos;s Results
            </span>
          </div>
        )}
        <h1 className="mb-2 text-4xl font-extrabold text-indigo-600 md:text-5xl">
          Quiz Complete! {emoji}
        </h1>
        <p className="text-lg text-gray-600">{result.themeName}</p>
      </header>

      {/* Score summary */}
      <div className="mx-auto mb-8 max-w-2xl rounded-3xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mb-4 text-6xl font-bold text-indigo-600 md:text-7xl">
            {result.score}/{result.questions.length}
          </div>
          <div className="text-2xl font-semibold text-gray-700">
            {percentage}% correct
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Total Time</div>
            <div className="text-xl font-bold text-gray-700">
              {formatTime(result.totalTime)}
            </div>
          </div>
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="text-sm text-gray-500">Avg per Question</div>
            <div className="text-xl font-bold text-gray-700">{avgTime}s</div>
          </div>
        </div>
      </div>

      {/* Question review */}
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-800 md:text-3xl">
          Review Your Answers
        </h2>

        <div className="space-y-6">
          {result.questions.map((question, idx) => {
            const userAnswer = result.userAnswers[idx];
            const isCorrect = userAnswer === question.correct;
            const wasSkipped = userAnswer === null;
            const timeSpent =
              result.answerTimes && result.answerTimes[idx]
                ? result.answerTimes[idx]
                : null;

            return (
              <div
                key={question.id}
                className={`rounded-2xl p-6 shadow-md ${
                  isCorrect
                    ? "border-l-4 border-green-500 bg-green-50"
                    : "border-l-4 border-red-500 bg-red-50"
                }`}
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <h3 className="text-lg font-semibold text-gray-800 md:text-xl">
                    {idx + 1}. {question.question}
                  </h3>
                  <div className="flex flex-shrink-0 items-center gap-2">
                    {timeSpent !== null && (
                      <span className="text-sm text-gray-500">{timeSpent}s</span>
                    )}
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-medium ${
                        isCorrect
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {isCorrect ? "Correct" : wasSkipped ? "Skipped" : "Wrong"}
                    </span>
                  </div>
                </div>

                <div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-4">
                  {question.answers.map((answer, ansIdx) => {
                    const isUserAnswer = userAnswer === ansIdx;
                    const isCorrectAnswer = question.correct === ansIdx;

                    return (
                      <div
                        key={ansIdx}
                        className={`rounded-xl p-3 text-sm md:text-base ${
                          isCorrectAnswer
                            ? "bg-green-200 font-semibold text-green-800"
                            : isUserAnswer
                              ? "bg-red-200 text-red-800"
                              : "bg-white text-gray-600"
                        }`}
                      >
                        <span className="font-bold">{answerLabels[ansIdx]}.</span>{" "}
                        {answer}
                        {isCorrectAnswer && " ✓"}
                        {isUserAnswer && !isCorrectAnswer && " ✗"}
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-white p-4">
                  <p className="text-sm font-medium text-indigo-600">
                    Explanation:
                  </p>
                  <p className="text-gray-700">{question.explanation}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="mx-auto mt-8 flex max-w-4xl justify-center gap-4">
        <button
          onClick={() => router.push("/")}
          className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95"
        >
          Back to Home
        </button>
        <button
          onClick={() =>
            router.push(`/quiz?theme=${result.themeId}&user=${result.userId}`)
          }
          className="rounded-2xl bg-gray-200 px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-300 active:scale-95"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
