import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

interface Question {
  id: number;
  question: string;
  answers: string[];
  correct: number;
  hint?: string;
}

interface QuizData {
  theme: string;
  themeId: string;
  level: string;
  totalTimeMinutes: number;
  questionTimeMinutes: number;
  questions: Question[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const theme = searchParams.get("theme"); // e.g., "addition-easy"
  const gradeParam = searchParams.get("grade");

  if (!theme) {
    return NextResponse.json(
      { error: "Missing theme parameter" },
      { status: 400 },
    );
  }

  // Parse theme and level from the theme param (e.g., "addition-easy" -> "addition", "easy")
  const lastDashIndex = theme.lastIndexOf("-");
  if (lastDashIndex === -1) {
    return NextResponse.json(
      { error: "Invalid theme format. Expected theme-level" },
      { status: 400 },
    );
  }

  const themeId = theme.substring(0, lastDashIndex);
  const level = theme.substring(lastDashIndex + 1);

  if (!["easy", "medium", "hard"].includes(level)) {
    return NextResponse.json(
      { error: "Invalid level. Must be easy, medium, or hard" },
      { status: 400 },
    );
  }

  // Get grade from parameter (default to 2)
  const grade = gradeParam ? parseInt(gradeParam) : 2;

  const dataDir = path.join(process.cwd(), "src", "data", `grade-${grade}`);
  const filePath = path.join(dataDir, `${themeId}-${level}.json`);

  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const quizData: QuizData = JSON.parse(fileContent);
    return NextResponse.json(quizData);
  } catch {
    return NextResponse.json(
      { error: `Quiz not found: ${theme} for grade ${grade}` },
      { status: 404 },
    );
  }
}
