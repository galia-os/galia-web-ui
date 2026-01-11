import { streamText } from 'ai';

interface MistakeData {
  questionNumber: number;
  question: string;
  userAnswer: string | null;
  correctAnswer: string;
  hint: string;
}

export async function POST(req: Request) {
  const { mistakes, themeName, userName, grade } = await req.json();

  const mistakesData = mistakes as MistakeData[];
  const studentName = userName || "buddy";
  const gradeLevel = grade || 5;

  // Group mistakes by concept/pattern if possible
  const mistakesSummary = mistakesData
    .map((m, i) => `${i + 1}. Question: "${m.question}"
   Student answered: ${m.userAnswer || "skipped"}
   Correct answer: ${m.correctAnswer}
   Hint: ${m.hint}`)
    .join('\n\n');

  const systemPrompt = `You are an expert, caring math tutor creating a personalized mini-lesson for a grade ${gradeLevel} student named ${studentName}.

Your task is to create an AUDIO lesson (that will be read aloud) to help ${studentName} understand the concepts they struggled with.

Guidelines:
1. Address ${studentName} by name warmly at the start
2. Keep it CONVERSATIONAL - this will be spoken, not read
3. Identify the common patterns or concepts in their mistakes
4. Explain these concepts clearly with simple examples
5. Use grade-appropriate language for grade ${gradeLevel}
6. Be encouraging - mistakes are learning opportunities!
7. Give 1-2 concrete tips they can use in Round 2
8. Keep it between 2-4 minutes when read aloud (roughly 300-500 words)
9. End with encouragement for Round 2

DO NOT:
- Use bullet points, numbers, or formatting (it's audio!)
- Be condescending
- Just repeat the hints - expand on them
- Make it longer than 5 minutes of audio

The lesson should feel like a friendly tutor talking directly to ${studentName}.`;

  const userPrompt = `Theme: ${themeName}

Here are the questions ${studentName} got wrong:

${mistakesSummary}

Please create a short, encouraging audio lesson that helps ${studentName} understand these concepts better before attempting Round 2.`;

  const result = streamText({
    model: 'openai/gpt-4o-mini' as any,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
