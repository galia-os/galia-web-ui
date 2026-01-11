"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import MathText from "@/components/MathText";

interface User {
  user_id: string;
  user_name: string;
}

interface SummaryStats {
  user_id: string;
  user_name: string;
  total_quizzes: number;
  total_questions: number;
  avg_time_per_question: number;
}

interface SeriousnessStats {
  user_name: string;
  theme_name: string;
  level: string;
  total_multi_round_sessions: number;
  total_mistakes: number;
  total_corrections: number;
  correction_rate: number;
  mastery_count: number;
  last_attempt: string;
}

interface SingleRoundStats {
  user_id: string;
  user_name: string;
  theme_name: string;
  level: string;
  total_sessions: number;
  perfect_sessions: number;
  last_attempt: string;
}

interface Round1Progress {
  user_id: string;
  user_name: string;
  theme_name: string;
  level: string;
  completed_at: string;
  percentage: number;
}

interface LearningRateProgress {
  user_name: string;
  theme_name: string;
  level: string;
  session_id: string;
  completed_at: string;
  correction_rate: number;
  mistakes: number;
  corrections: number;
}

interface RepeatedMistake {
  user_name: string;
  theme_name: string;
  level: string;
  question: string;
  correct_answer: string;
  count: number;
}

interface TestSummaryStats {
  user_id: string;
  user_name: string;
  total_tests: number;
  total_questions: number;
  avg_percentage: number;
  avg_time_per_question: number;
}

interface TestProgress {
  user_id: string;
  user_name: string;
  level: string;
  completed_at: string;
  score: number;
  total_questions: number;
  percentage: number;
  total_time_seconds: number;
}

interface TestThemeBreakdown {
  user_name: string;
  source_theme: string;
  total_questions: number;
  correct_count: number;
  percentage: number;
}

interface QuizResult {
  id: number;
  user_id: string;
  user_name: string;
  theme_name: string;
  level: string;
  round: number;
  score: number;
  total_questions: number;
  percentage: number;
  total_time_seconds: number;
  avg_time_per_question: number;
  completed_at: string;
  is_test_mode: boolean;
  session_id: string | null;
  all_answers: Array<{
    question: string;
    userAnswer: number | null;
    correctAnswer: number;
    answers: string[];
    sourceTheme?: string;
  }>;
  mistakes: Array<{
    question: string;
    userAnswer: string | null;
    correctAnswer: string;
  }>;
}

interface Stats {
  users: User[];
  summaryStats: SummaryStats[];
  seriousnessStats: SeriousnessStats[];
  singleRoundStats: SingleRoundStats[];
  round1Progress: Round1Progress[];
  learningRateProgress: LearningRateProgress[];
  repeatedMistakes: RepeatedMistake[];
  testSummaryStats: TestSummaryStats[];
  testProgress: TestProgress[];
  testThemeBreakdown: TestThemeBreakdown[];
  allQuizResults: QuizResult[];
}

type TabType = "training" | "tests" | "quizzes";

const userColors: Record<string, { bg: string }> = {
  Z: { bg: "bg-pink-500" },
  I: { bg: "bg-yellow-500" },
  R: { bg: "bg-blue-500" },
};

const levelConfig: Record<string, { color: string; label: string }> = {
  easy: { color: "#22c55e", label: "Easy" },
  medium: { color: "#eab308", label: "Medium" },
  hard: { color: "#ef4444", label: "Hard" },
};

// Speed gauge component (half circle)
function SpeedGauge({
  percentage,
  size = 120,
  label,
  showTicks = true,
  strokeWidth: customStrokeWidth,
  fontSize,
}: {
  percentage: number;
  size?: number;
  label?: string;
  showTicks?: boolean;
  strokeWidth?: number;
  fontSize?: string;
}) {
  const strokeWidth = customStrokeWidth || (size > 60 ? 10 : 6);
  const radius = (size - strokeWidth) / 2;
  const halfCircumference = Math.PI * radius;
  const offset = halfCircumference - (percentage / 100) * halfCircumference;

  const getColor = (pct: number) => {
    if (pct >= 50) return "#22c55e";
    if (pct >= 25) return "#eab308";
    return "#ef4444";
  };

  const color = getColor(percentage);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size / 2 + (size > 60 ? 15 : 8) }}>
        <svg width={size} height={size / 2 + 10} className="overflow-visible">
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          <path
            d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={halfCircumference}
            strokeDashoffset={offset}
            className="transition-all duration-700"
          />
          {showTicks && [0, 25, 50, 75, 100].map((tick) => {
            const angle = Math.PI - (tick / 100) * Math.PI;
            const x1 = size / 2 + (radius - 6) * Math.cos(angle);
            const y1 = size / 2 - (radius - 6) * Math.sin(angle);
            const x2 = size / 2 + (radius + 2) * Math.cos(angle);
            const y2 = size / 2 - (radius + 2) * Math.sin(angle);
            return (
              <line
                key={tick}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#d1d5db"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 text-center">
          <span className={`${fontSize || (size > 60 ? 'text-xl' : 'text-xs')} font-bold`} style={{ color }}>
            {Math.round(percentage)}%
          </span>
        </div>
      </div>
      {label && <div className="text-xs text-gray-500 mt-1">{label}</div>}
    </div>
  );
}

// Chart component
function ThemeChart({ data }: { data: Round1Progress[] }) {
  const byLevel: Record<string, number[]> = { easy: [], medium: [], hard: [] };
  const sorted = [...data].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  sorted.forEach(p => {
    if (byLevel[p.level]) {
      byLevel[p.level].push(Number(p.percentage));
    }
  });

  const maxTests = Math.max(byLevel.easy.length, byLevel.medium.length, byLevel.hard.length);

  if (maxTests === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        No data yet
      </div>
    );
  }

  const chartData = Array.from({ length: maxTests }, (_, i) => ({
    testNum: i + 1,
    easy: byLevel.easy[i] ?? null,
    medium: byLevel.medium[i] ?? null,
    hard: byLevel.hard[i] ?? null,
  }));

  return (
    <div className="h-48">
      <div className="flex gap-3 mb-2 text-xs">
        {["easy", "medium", "hard"].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig[level].color }} />
            <span>{levelConfig[level].label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <XAxis dataKey="testNum" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value, name) => [`${value}%`, levelConfig[name as string]?.label || name]} />
          <Line type="monotone" dataKey="easy" stroke={levelConfig.easy.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="medium" stroke={levelConfig.medium.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="hard" stroke={levelConfig.hard.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Learning Rate Chart component
function LearningRateChart({ data }: { data: LearningRateProgress[] }) {
  const byLevel: Record<string, number[]> = { easy: [], medium: [], hard: [] };
  const sorted = [...data].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  sorted.forEach(p => {
    if (byLevel[p.level]) {
      byLevel[p.level].push(p.correction_rate);
    }
  });

  const maxSessions = Math.max(byLevel.easy.length, byLevel.medium.length, byLevel.hard.length);

  if (maxSessions === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        No retry data yet
      </div>
    );
  }

  const chartData = Array.from({ length: maxSessions }, (_, i) => ({
    sessionNum: i + 1,
    easy: byLevel.easy[i] ?? null,
    medium: byLevel.medium[i] ?? null,
    hard: byLevel.hard[i] ?? null,
  }));

  return (
    <div className="h-48">
      <div className="flex gap-3 mb-2 text-xs">
        {["easy", "medium", "hard"].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig[level].color }} />
            <span>{levelConfig[level].label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <XAxis dataKey="sessionNum" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value, name) => [`${value}%`, levelConfig[name as string]?.label || name]} />
          <Line type="monotone" dataKey="easy" stroke={levelConfig.easy.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="medium" stroke={levelConfig.medium.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="hard" stroke={levelConfig.hard.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Test Progress Chart component
function TestProgressChart({ data }: { data: TestProgress[] }) {
  const byLevel: Record<string, number[]> = { easy: [], medium: [], hard: [] };
  const sorted = [...data].sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

  sorted.forEach(p => {
    if (byLevel[p.level]) {
      byLevel[p.level].push(Number(p.percentage));
    }
  });

  const maxTests = Math.max(byLevel.easy.length, byLevel.medium.length, byLevel.hard.length);

  if (maxTests === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
        No test data yet
      </div>
    );
  }

  const chartData = Array.from({ length: maxTests }, (_, i) => ({
    testNum: i + 1,
    easy: byLevel.easy[i] ?? null,
    medium: byLevel.medium[i] ?? null,
    hard: byLevel.hard[i] ?? null,
  }));

  return (
    <div className="h-48">
      <div className="flex gap-3 mb-2 text-xs">
        {["easy", "medium", "hard"].map(level => (
          <div key={level} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: levelConfig[level].color }} />
            <span>{levelConfig[level].label}</span>
          </div>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
          <XAxis dataKey="testNum" tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#9ca3af" }} axisLine={{ stroke: "#e5e7eb" }} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(value, name) => [`${value}%`, levelConfig[name as string]?.label || name]} />
          <Line type="monotone" dataKey="easy" stroke={levelConfig.easy.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="medium" stroke={levelConfig.medium.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
          <Line type="monotone" dataKey="hard" stroke={levelConfig.hard.color} strokeWidth={2} dot={{ r: 3 }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

// Segmented Control component
function SegmentedControl({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: TabType) => void;
  options: { value: TabType; label: string }[];
}) {
  return (
    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
            value === option.value
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// Format time helper
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

// Format date helper
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}

// Session type for grouping quizzes
interface QuizSession {
  sessionId: string;
  theme_name: string;
  level: string;
  is_test_mode: boolean;
  rounds: QuizResult[];
  lastCompletedAt: string;
  bestPercentage: number;
}

// Group quizzes into sessions
function groupQuizzesBySessions(quizzes: QuizResult[]): QuizSession[] {
  const sessionMap = new Map<string, QuizSession>();

  for (const quiz of quizzes) {
    // Use session_id if available, otherwise create synthetic one
    const sessionKey = quiz.session_id || `synthetic-${quiz.id}`;

    if (!sessionMap.has(sessionKey)) {
      sessionMap.set(sessionKey, {
        sessionId: sessionKey,
        theme_name: quiz.theme_name,
        level: quiz.level,
        is_test_mode: quiz.is_test_mode,
        rounds: [],
        lastCompletedAt: quiz.completed_at,
        bestPercentage: quiz.percentage,
      });
    }

    const session = sessionMap.get(sessionKey)!;
    session.rounds.push(quiz);

    // Update best percentage and last completed
    if (quiz.percentage > session.bestPercentage) {
      session.bestPercentage = quiz.percentage;
    }
    if (new Date(quiz.completed_at) > new Date(session.lastCompletedAt)) {
      session.lastCompletedAt = quiz.completed_at;
    }
  }

  // Sort rounds within each session
  for (const session of sessionMap.values()) {
    session.rounds.sort((a, b) => a.round - b.round);
  }

  // Convert to array and sort by date DESC
  return Array.from(sessionMap.values()).sort(
    (a, b) => new Date(b.lastCompletedAt).getTime() - new Date(a.lastCompletedAt).getTime()
  );
}

// Quiz Detail View component with round navigation
function QuizDetailView({
  session,
  selectedRound,
  onRoundChange,
}: {
  session: QuizSession;
  selectedRound: number;
  onRoundChange: (round: number) => void;
}) {
  const [errorsOnly, setErrorsOnly] = useState(true);
  const quiz = session.rounds.find(r => r.round === selectedRound) || session.rounds[0];

  // Filter answers based on errorsOnly toggle
  const displayedAnswers = errorsOnly
    ? quiz.all_answers.filter(a => a.userAnswer !== a.correctAnswer)
    : quiz.all_answers;

  const errorCount = quiz.all_answers.filter(a => a.userAnswer !== a.correctAnswer).length;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "easy": return "bg-green-100 text-green-700";
      case "medium": return "bg-yellow-100 text-yellow-700";
      case "hard": return "bg-red-100 text-red-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      {/* Quiz Header */}
      <div className="sticky top-0 bg-white border-b p-4 z-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-lg text-gray-800">{quiz.theme_name}</h2>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(quiz.level)}`}>
            {quiz.level}
          </span>
        </div>

        {/* Round Segmented Control */}
        {session.rounds.length > 1 && (
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1 mb-3">
            {session.rounds.map((round) => (
              <button
                key={round.round}
                onClick={() => onRoundChange(round.round)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedRound === round.round
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Round {round.round}
                <span className={`ml-1 ${
                  round.percentage >= 80 ? "text-green-600" :
                  round.percentage >= 60 ? "text-yellow-600" : "text-red-600"
                }`}>
                  ({round.percentage}%)
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{quiz.score}/{quiz.total_questions} correct</span>
            <span>{formatTime(quiz.total_time_seconds)}</span>
          </div>

          {/* Errors Only Toggle */}
          <button
            onClick={() => setErrorsOnly(!errorsOnly)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              errorsOnly
                ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${errorsOnly ? "bg-red-500" : "bg-gray-400"}`} />
            Errors only ({errorCount})
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="p-4 space-y-4">
        {displayedAnswers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🎉</div>
            <p>No errors in this round!</p>
            <button
              onClick={() => setErrorsOnly(false)}
              className="mt-2 text-sm text-indigo-600 hover:underline"
            >
              Show all questions
            </button>
          </div>
        ) : displayedAnswers.map((answer, idx) => {
          const originalIndex = quiz.all_answers.indexOf(answer);
          const isCorrect = answer.userAnswer === answer.correctAnswer;
          const answers = answer.answers || [];

          // Try to get answer texts from answers array first, then fallback to mistakes array
          let userAnswerText = answer.userAnswer !== null && answer.userAnswer !== undefined ? answers[answer.userAnswer] : null;
          let correctAnswerText = answers[answer.correctAnswer];

          // Fallback to mistakes array for both user answer and correct answer text
          if ((!userAnswerText || !correctAnswerText) && quiz.mistakes) {
            const mistake = quiz.mistakes.find(m => m.question === answer.question);
            if (mistake) {
              if (!userAnswerText && mistake.userAnswer) {
                userAnswerText = mistake.userAnswer;
              }
              if (!correctAnswerText) {
                correctAnswerText = mistake.correctAnswer;
              }
            }
          }

          return (
            <div
              key={idx}
              className={`rounded-xl p-4 border-2 ${
                isCorrect ? "bg-white border-green-300" : "bg-white border-red-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <span className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
                  isCorrect ? "bg-green-500 text-white" : "bg-red-500 text-white"
                }`}>
                  {isCorrect ? "✓" : "✗"}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    <span className="text-gray-400 mr-2">Q{originalIndex + 1}.</span>
                    <MathText text={answer.question || ""} />
                  </div>
                  {answer.sourceTheme && (
                    <p className="text-xs text-gray-400 mb-3">{answer.sourceTheme}</p>
                  )}

                  {/* Clear answer display */}
                  <div className="space-y-2 mt-3">
                    {!isCorrect && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-red-600 w-20 shrink-0 pt-0.5">Your answer:</span>
                        <div className="flex-1 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-800">
                          {answer.userAnswer !== null && answer.userAnswer !== undefined ? (
                            <>
                              <span className="text-red-400 mr-1">{String.fromCharCode(65 + answer.userAnswer)}.</span>
                              {userAnswerText ? (
                                <MathText text={userAnswerText} />
                              ) : (
                                <span className="italic text-red-400">(answer not saved)</span>
                              )}
                            </>
                          ) : (
                            <span className="italic text-red-400">No answer</span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-green-600 w-20 shrink-0 pt-0.5">
                        {isCorrect ? "Your answer:" : "Correct:"}
                      </span>
                      <div className="flex-1 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                        <span className="text-green-500 mr-1">{String.fromCharCode(65 + answer.correctAnswer)}.</span>
                        {correctAnswerText ? (
                          <MathText text={correctAnswerText} />
                        ) : (
                          <span className="italic text-green-400">(answer not saved)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* All options (collapsed by default for wrong answers) */}
                  {!isCorrect && answers.length > 0 && (
                    <details className="mt-3">
                      <summary className="text-xs text-gray-400 cursor-pointer hover:text-gray-600">
                        Show all options
                      </summary>
                      <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
                        {answers.map((ans, ansIdx) => (
                          <div
                            key={ansIdx}
                            className={`text-xs px-2 py-1 rounded ${
                              answer.correctAnswer === ansIdx
                                ? "text-green-700 font-medium"
                                : answer.userAnswer === ansIdx
                                  ? "text-red-700"
                                  : "text-gray-500"
                            }`}
                          >
                            {String.fromCharCode(65 + ansIdx)}. <MathText text={ans || ""} />
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number>(1);

  // Get initial values from URL
  const urlUser = searchParams.get("user");
  const urlTab = searchParams.get("tab") as TabType | null;

  const [selectedUser, setSelectedUser] = useState<string | null>(urlUser);
  const [activeTab, setActiveTab] = useState<TabType>(urlTab || "training");

  // Update URL when user or tab changes
  const updateUrl = (user: string | null, tab: TabType) => {
    const params = new URLSearchParams();
    if (user) params.set("user", user);
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`, { scroll: false });
  };

  const handleUserChange = (userName: string) => {
    setSelectedUser(userName);
    setSelectedSessionId(null);
    setSelectedRound(1);
    updateUrl(userName, activeTab);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedSessionId(null);
    setSelectedRound(1);
    updateUrl(selectedUser, tab);
  };

  const handleSessionSelect = (sessionId: string, sessions: QuizSession[]) => {
    setSelectedSessionId(sessionId);
    const session = sessions.find(s => s.sessionId === sessionId);
    if (session && session.rounds.length > 0) {
      setSelectedRound(session.rounds[0].round);
    }
  };

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setStats(data);
          // Set initial user from URL or first user
          if (!selectedUser && data.users?.length > 0) {
            const initialUser = urlUser || data.users[0].user_name;
            setSelectedUser(initialUser);
            updateUrl(initialUser, activeTab);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load stats");
        setLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-bounce">📊</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || stats.users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-5xl">📭</div>
          <p className="text-gray-600">{error || "No data yet"}</p>
          <button onClick={() => router.push("/")} className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-white">
            Home
          </button>
        </div>
      </div>
    );
  }

  // Get data for selected user
  const userSummary = stats.summaryStats.find(s => s.user_name === selectedUser);
  const userSeriousness = stats.seriousnessStats.filter(s => s.user_name === selectedUser);
  const userSingleRound = stats.singleRoundStats.filter(s => s.user_name === selectedUser);
  const userRound1Progress = stats.round1Progress.filter(p => p.user_name === selectedUser);
  const userLearningRateProgress = stats.learningRateProgress.filter(p => p.user_name === selectedUser);
  const userMistakes = stats.repeatedMistakes.filter(m => m.user_name === selectedUser);

  // Test mode data
  const userTestSummary = stats.testSummaryStats.find(s => s.user_name === selectedUser);
  const userTestProgress = stats.testProgress.filter(p => p.user_name === selectedUser);
  const userTestThemeBreakdown = stats.testThemeBreakdown.filter(t => t.user_name === selectedUser);

  // Quiz results for inbox view - grouped by session
  const userQuizResults = stats.allQuizResults.filter(q => q.user_name === selectedUser);
  const userSessions = groupQuizzesBySessions(userQuizResults);
  const selectedSession = userSessions.find(s => s.sessionId === selectedSessionId);

  // Calculate stats
  const totalMistakes = userSeriousness.reduce((sum, s) => sum + s.total_mistakes, 0);
  const totalCorrections = userSeriousness.reduce((sum, s) => sum + s.total_corrections, 0);
  const overallCorrectionRate = totalMistakes > 0 ? (totalCorrections / totalMistakes) * 100 : 0;

  // Get unique themes sorted by last attempt
  const themeLastAttempt: Record<string, Date> = {};
  [...userSeriousness, ...userSingleRound].forEach(s => {
    const date = new Date(s.last_attempt);
    if (!themeLastAttempt[s.theme_name] || date > themeLastAttempt[s.theme_name]) {
      themeLastAttempt[s.theme_name] = date;
    }
  });
  const userThemes = Object.keys(themeLastAttempt).sort(
    (a, b) => themeLastAttempt[b].getTime() - themeLastAttempt[a].getTime()
  );

  // Calculate combined stats
  const totalQuizzes = (userSummary?.total_quizzes || 0) + (userTestSummary?.total_tests || 0);
  const totalQuestions = (userSummary?.total_questions || 0) + (userTestSummary?.total_questions || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
        <button onClick={() => router.push("/")} className="text-sm text-gray-500 hover:text-gray-700">
          Home
        </button>
      </header>

      {/* User Selector */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {stats.users.map((user) => {
          const color = userColors[user.user_id] || { bg: "bg-gray-500" };
          const isSelected = user.user_name === selectedUser;
          return (
            <button
              key={user.user_id}
              onClick={() => handleUserChange(user.user_name)}
              className={`rounded-full px-4 py-2 font-medium transition-all ${
                isSelected ? `${color.bg} text-white shadow-lg scale-105` : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
            >
              {user.user_name}
            </button>
          );
        })}
      </div>

      {/* Summary Row - 3 Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-indigo-600">{totalQuizzes}</div>
          <div className="text-xs text-gray-500 mt-1">Quizzes</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
          <div className="text-3xl font-bold text-purple-600">{totalQuestions}</div>
          <div className="text-xs text-gray-500 mt-1">Questions</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm flex flex-col items-center justify-center">
          <SpeedGauge percentage={overallCorrectionRate} size={90} label="Learning Rate" />
        </div>
      </div>

      {/* Segmented Control */}
      <div className="mb-6">
        <SegmentedControl
          value={activeTab}
          onChange={handleTabChange}
          options={[
            { value: "training", label: "Training" },
            { value: "tests", label: "Tests" },
            { value: "quizzes", label: "Quizzes" },
          ]}
        />
      </div>

      {/* Tab Content */}
      {activeTab === "training" && (
        <div>
          {/* Info about the metric */}
          <div className="mb-4 px-2 py-2 bg-blue-50 rounded-lg text-xs text-blue-700">
            <strong>Learning Rate</strong> = % of mistakes corrected on retry. Random clicking = 25%.
          </div>

          {/* Per-Theme Rows */}
          {userThemes.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
              <div className="text-4xl mb-2">📚</div>
              <p className="text-gray-500">No training data yet for {selectedUser}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {userThemes.map(theme => {
                const themeData = userRound1Progress.filter(p => p.theme_name === theme);
                const themeLearningData = userLearningRateProgress.filter(p => p.theme_name === theme);

                return (
                  <div key={theme}>
                    <h2 className="font-bold text-gray-800 mb-2 px-1">{theme}</h2>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="text-xs text-gray-400 mb-1">Round 1 Success %</div>
                        <ThemeChart data={themeData} />
                      </div>
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <div className="text-xs text-gray-400 mb-1">Learning Rate %</div>
                        <LearningRateChart data={themeLearningData} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Repeated Mistakes */}
          {userMistakes.length > 0 && (
            <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
              <h2 className="mb-4 font-bold text-gray-800">
                Needs Review
                <span className="ml-2 text-sm font-normal text-gray-500">(missed 2+ times)</span>
              </h2>
              <div className="space-y-2">
                {userMistakes.slice(0, 10).map((mistake, idx) => (
                  <div key={idx} className="rounded-xl bg-red-50 p-3 border border-red-100">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-gray-500 mb-1">{mistake.theme_name} · {mistake.level}</div>
                        <p className="text-sm text-gray-800">{mistake.question}</p>
                        <p className="text-xs text-green-600 mt-1">Correct: {mistake.correct_answer}</p>
                      </div>
                      <span className="ml-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-200 text-xs font-bold text-red-700">
                        {mistake.count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "tests" && (
        <div>
          {userTestSummary ? (
            <>
              {/* Test Summary Stats */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
                  <div className="text-3xl font-bold text-emerald-600">{userTestSummary.total_tests}</div>
                  <div className="text-xs text-gray-500 mt-1">Tests Taken</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm text-center">
                  <div className="text-3xl font-bold text-teal-600">{userTestSummary.total_questions || 0}</div>
                  <div className="text-xs text-gray-500 mt-1">Questions</div>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm flex flex-col items-center justify-center">
                  <SpeedGauge percentage={userTestSummary.avg_percentage || 0} size={90} label="Avg Score" />
                </div>
              </div>

              {/* Test Progress Chart */}
              <div className="rounded-2xl bg-white p-4 shadow-sm mb-6">
                <div className="text-xs text-gray-400 mb-2">Test Scores Over Time</div>
                <TestProgressChart data={userTestProgress} />
              </div>

              {/* Per-Theme Breakdown */}
              {userTestThemeBreakdown.length > 0 && (
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <h3 className="mb-4 font-bold text-gray-800">Performance by Topic</h3>
                  <div className="space-y-2">
                    {userTestThemeBreakdown.map((theme, idx) => {
                      const getBarColor = (pct: number) => {
                        if (pct >= 80) return "bg-green-500";
                        if (pct >= 60) return "bg-yellow-500";
                        return "bg-red-500";
                      };
                      return (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-gray-700 truncate">{theme.source_theme}</div>
                            <div className="mt-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${getBarColor(theme.percentage)}`}
                                style={{ width: `${theme.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="text-right shrink-0 w-20">
                            <div className="text-sm font-bold text-gray-700">{theme.percentage}%</div>
                            <div className="text-xs text-gray-400">{theme.correct_count}/{theme.total_questions}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
              <div className="text-4xl mb-2">📝</div>
              <p className="text-gray-500">No test data yet for {selectedUser}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "quizzes" && (
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
          <div className="flex h-full">
            {/* Left Sidebar - Session List */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              {userSessions.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-2">📋</div>
                  <p className="text-gray-500 text-sm">No quizzes yet</p>
                </div>
              ) : (
                <div>
                  {userSessions.map((session) => {
                    const isSelected = session.sessionId === selectedSessionId;
                    const getLevelDot = (level: string) => {
                      switch (level) {
                        case "easy": return "bg-green-500";
                        case "medium": return "bg-yellow-500";
                        case "hard": return "bg-red-500";
                        default: return "bg-gray-500";
                      }
                    };
                    const roundCount = session.rounds.length;
                    const firstRound = session.rounds[0];

                    return (
                      <button
                        key={session.sessionId}
                        onClick={() => handleSessionSelect(session.sessionId, userSessions)}
                        className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          isSelected ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${getLevelDot(session.level)}`} />
                              <span className="text-sm font-medium text-gray-800 truncate">
                                {session.theme_name}
                              </span>
                              {session.is_test_mode && (
                                <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
                                  Test
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className={`font-medium ${
                                session.bestPercentage >= 80 ? "text-green-600" :
                                session.bestPercentage >= 60 ? "text-yellow-600" : "text-red-600"
                              }`}>
                                {session.bestPercentage}%
                              </span>
                              <span>{firstRound.score}/{firstRound.total_questions}</span>
                              {roundCount > 1 && (
                                <span className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                  {roundCount} rounds
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 ml-2">
                            {formatDate(session.lastCompletedAt)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Main View - Quiz Details */}
            <div className="flex-1 bg-gray-50">
              {selectedSession ? (
                <QuizDetailView
                  session={selectedSession}
                  selectedRound={selectedRound}
                  onRoundChange={setSelectedRound}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-5xl mb-3">👈</div>
                    <p>Select a session to view details</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-5xl animate-bounce">📊</div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
