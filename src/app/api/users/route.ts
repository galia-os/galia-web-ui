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

  const users = userNames.map((name, index) => ({
    id: name[0].toUpperCase(),
    name,
    ...COLORS[index % COLORS.length],
  }));

  return NextResponse.json(users);
}
