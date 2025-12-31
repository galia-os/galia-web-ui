"use client";

import { useEffect, useState, useCallback, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import QuestionCard from "@/components/QuestionCard";
import Timer from "@/components/Timer";
import ProgressBar from "@/components/ProgressBar";
import { QuizData, User, Mistake } from "@/lib/types";

interface QuizState {
  currentQuestion: number;
  answers: (number | null)[];
  answerTimes: number[];
  startTime: number;
}

function QuizContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const themeId = searchParams.get("theme");
  const userId = searchParams.get("user");

  const [user, setUser] = useState<User | null>(null);
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestion: 0,
    answers: [],
    answerTimes: [],
    startTime: Date.now(),
  });
  const [questionKey, setQuestionKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!themeId || !userId) {
      router.push("/");
      return;
    }

    // Load users and quiz data
    Promise.all([
      fetch("/api/users").then((res) => res.json()),
      import(`@/data/${themeId}.json`).then((data) => data.default || data),
    ])
      .then(([users, quizDataParsed]) => {
        const foundUser = users.find((u: User) => u.id === userId);
        if (!foundUser) {
          router.push("/");
          return;
        }
        setUser(foundUser);
        setQuizData(quizDataParsed);
        setQuizState({
          currentQuestion: 0,
          answers: new Array(quizDataParsed.questions.length).fill(null),
          answerTimes: new Array(quizDataParsed.questions.length).fill(0),
          startTime: Date.now(),
        });
        questionStartRef.current = Date.now();
        setLoading(false);
      })
      .catch(() => {
        router.push("/");
      });
  }, [themeId, userId, router]);

  const submitResults = useCallback(
    async (finalState: QuizState) => {
      if (!quizData || !user || submitting) return;
      setSubmitting(true);

      const score = finalState.answers.reduce<number>((acc, answer, idx) => {
        return acc + (answer === quizData.questions[idx].correct ? 1 : 0);
      }, 0);

      const totalTimeSeconds = Math.floor((Date.now() - finalState.startTime) / 1000);
      const avgTimePerQuestion =
        finalState.answerTimes.reduce((a, b) => a + b, 0) / quizData.questions.length;

      const mistakes: Mistake[] = quizData.questions
        .map((q, idx) => {
          const userAnswer = finalState.answers[idx];
          if (userAnswer === q.correct) return null;
          return {
            questionNumber: idx + 1,
            question: q.question,
            userAnswer: userAnswer !== null ? q.answers[userAnswer] : null,
            correctAnswer: q.answers[q.correct],
            explanation: q.explanation,
          };
        })
        .filter((m): m is Mistake => m !== null);

      const allAnswers = quizData.questions.map((q, idx) => ({
        questionId: q.id,
        question: q.question,
        userAnswer: finalState.answers[idx],
        correctAnswer: q.correct,
        timeSpent: finalState.answerTimes[idx],
      }));

      // Store in session for results page
      const resultForDisplay = {
        themeId: quizData.themeId,
        themeName: quizData.theme,
        userId: user.id,
        userName: user.name,
        questions: quizData.questions,
        userAnswers: finalState.answers,
        answerTimes: finalState.answerTimes,
        score,
        totalTime: totalTimeSeconds,
        completedAt: new Date().toISOString(),
      };
      sessionStorage.setItem("quizResult", JSON.stringify(resultForDisplay));

      // Submit to API
      try {
        await fetch("/api/results", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            userName: user.name,
            themeId: quizData.themeId,
            themeName: quizData.theme,
            score,
            totalQuestions: quizData.questions.length,
            totalTimeSeconds,
            avgTimePerQuestion,
            mistakes,
            allAnswers,
          }),
        });
      } catch (error) {
        console.error("Failed to submit results:", error);
      }

      router.push("/results");
    },
    [quizData, user, router, submitting]
  );

  const handleTimeUp = useCallback(() => {
    // Record time for current question before submitting
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setQuizState((prev) => {
      const newAnswerTimes = [...prev.answerTimes];
      newAnswerTimes[prev.currentQuestion] = timeSpent;
      const finalState = { ...prev, answerTimes: newAnswerTimes };
      submitResults(finalState);
      return finalState;
    });
  }, [submitResults]);

  const handleSelectAnswer = (answerIndex: number) => {
    setQuizState((prev) => {
      const newAnswers = [...prev.answers];
      newAnswers[prev.currentQuestion] = answerIndex;
      return { ...prev, answers: newAnswers };
    });
  };

  const handleNext = () => {
    if (!quizData) return;

    // Record time for current question
    const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);

    if (quizState.currentQuestion < quizData.questions.length - 1) {
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] = timeSpent;
        return {
          ...prev,
          currentQuestion: prev.currentQuestion + 1,
          answerTimes: newAnswerTimes,
        };
      });
      questionStartRef.current = Date.now();
      setQuestionKey((k) => k + 1);
    } else {
      // Quiz finished
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] = timeSpent;
        const finalState = { ...prev, answerTimes: newAnswerTimes };
        submitResults(finalState);
        return finalState;
      });
    }
  };

  const handlePrevious = () => {
    if (quizState.currentQuestion > 0) {
      // Record time for current question
      const timeSpent = Math.floor((Date.now() - questionStartRef.current) / 1000);
      setQuizState((prev) => {
        const newAnswerTimes = [...prev.answerTimes];
        newAnswerTimes[prev.currentQuestion] += timeSpent;
        return {
          ...prev,
          currentQuestion: prev.currentQuestion - 1,
          answerTimes: newAnswerTimes,
        };
      });
      questionStartRef.current = Date.now();
      setQuestionKey((k) => k + 1);
    }
  };

  if (loading || !quizData || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🧮</div>
          <p className="text-xl text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📊</div>
          <p className="text-xl text-gray-600">Saving your results...</p>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[quizState.currentQuestion];
  const isLastQuestion = quizState.currentQuestion === quizData.questions.length - 1;
  const totalTimeSeconds = quizData.totalTimeMinutes * 60;
  const questionTimeSeconds = quizData.questionTimeMinutes * 60;

  return (
    <div className="flex min-h-screen flex-col p-4 md:p-8">
      {/* Header with timers */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold text-white ${user.bgColor}`}
          >
            {user.id}
          </span>
          <span className="text-2xl font-bold text-indigo-600 md:text-3xl">
            Galamath
          </span>
        </div>
        <div className="flex gap-3">
          <Timer
            key={`question-${questionKey}`}
            initialSeconds={questionTimeSeconds}
            label="Question"
            isIndicative
            resetKey={questionKey}
          />
          <Timer
            initialSeconds={totalTimeSeconds}
            onTimeUp={handleTimeUp}
            label="Total"
          />
        </div>
      </header>

      {/* Progress */}
      <div className="mb-6">
        <ProgressBar
          current={quizState.currentQuestion}
          total={quizData.questions.length}
        />
      </div>

      {/* Question */}
      <main className="flex-1">
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={quizState.answers[quizState.currentQuestion]}
          onSelectAnswer={handleSelectAnswer}
        />
      </main>

      {/* Navigation */}
      <footer className="mt-6 flex justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={quizState.currentQuestion === 0}
          className="rounded-2xl bg-gray-200 px-8 py-4 text-lg font-semibold text-gray-700 transition-all hover:bg-gray-300 active:scale-95 disabled:opacity-40 disabled:active:scale-100 md:px-12 md:text-xl"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white transition-all hover:bg-indigo-700 active:scale-95 md:px-12 md:text-xl"
        >
          {isLastQuestion ? "Finish" : "Next"}
        </button>
      </footer>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mb-4 text-6xl">🧮</div>
            <p className="text-xl text-gray-600">Loading quiz...</p>
          </div>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
