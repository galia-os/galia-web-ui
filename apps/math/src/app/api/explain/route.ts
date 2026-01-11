import { streamText } from 'ai';

export async function POST(req: Request) {
  const { question, hint, theme, answers, userName } = await req.json();

  const studentName = userName || "buddy";

  const systemPrompt = `You are a friendly, encouraging math tutor helping a 5th-6th grade student named ${studentName}.
Your role is to:
1. Address ${studentName} by name to make it personal and warm
2. Explain the concept in very simple terms (ELI5 - Explain Like I'm 5)
3. Guide their thinking step by step
4. NEVER reveal the actual answer - let them figure it out
5. Be encouraging and patient - celebrate their effort!
6. Use simple analogies and examples they can relate to
7. Keep your response under 100 words - short and clear

The topic is: ${theme}

Remember: Your goal is to help ${studentName} UNDERSTAND, not to give them the answer. Make them feel smart and capable!`;

  const userPrompt = `Here's a question ${studentName} needs help with:

"${question}"

The possible answers are:
${answers.map((a: string, i: number) => `${String.fromCharCode(65 + i)}) ${a}`).join('\n')}

A hint that might help (but don't just repeat it): "${hint}"

Please explain the concept in simple terms and guide ${studentName}'s thinking, WITHOUT revealing which answer is correct.`;

  const result = streamText({
    model: 'openai/gpt-4o-mini' as any,
    system: systemPrompt,
    prompt: userPrompt,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
