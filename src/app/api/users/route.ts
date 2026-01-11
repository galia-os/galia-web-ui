import { NextResponse } from "next/server";

const COLORS = [
  { color: "#ec4899", bgColor: "bg-pink-500" },
  { color: "#eab308", bgColor: "bg-yellow-500" },
  { color: "#3b82f6", bgColor: "bg-blue-500" },
  { color: "#22c55e", bgColor: "bg-green-500" },
  { color: "#f97316", bgColor: "bg-orange-500" },
  { color: "#8b5cf6", bgColor: "bg-violet-500" },
];

export async function GET() {
  const usersEnv = process.env.USERS!;
  const userNames = usersEnv.split(",").map((name) => name.trim());

  // Parse user grades from USER_GRADES env var (format: "Zoe:5,Iris:4,Rose:2")
  const userGradesEnv = process.env.USER_GRADES || "";
  const gradeMap = new Map<string, number>();
  userGradesEnv.split(",").forEach((entry) => {
    const [name, grade] = entry.split(":");
    if (name && grade) gradeMap.set(name.trim(), parseInt(grade));
  });

  const users = userNames.map((name, index) => ({
    id: name[0].toUpperCase(),
    name,
    grade: gradeMap.get(name) || 2, // default to grade 2
    ...COLORS[index % COLORS.length],
  }));

  return NextResponse.json(users);
}
