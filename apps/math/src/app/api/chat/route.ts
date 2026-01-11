import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(req: Request) {
  const { messages, question, hint, theme, answers, userName } = await req.json();

  const studentName = userName || "buddy";

  const systemPrompt = `You are a friendly, encouraging math tutor helping a 5th-6th grade student named ${studentName}.

IMPORTANT RULES:
1. You can ONLY discuss mathematics and the current question. If ${studentName} asks about anything else, gently redirect them back to math.
2. Address ${studentName} by name to make it personal and warm
3. Explain concepts in very simple terms (ELI5 - Explain Like I'm 5)
4. Guide their thinking step by step
5. NEVER reveal the actual answer - let them figure it out
6. Be encouraging and patient - celebrate their effort!
7. Use simple analogies and examples they can relate to
8. Keep responses under 80 words - short and clear for a child

The current math topic is: ${theme}
The question they're working on: "${question}"
The possible answers are:
${answers.map((a: string, i: number) => `${String.fromCharCode(65 + i)}) ${a}`).join('\n')}
A hint (don't just repeat it): "${hint}"

If ${studentName} asks about non-math topics, say something like: "That's interesting, but let's focus on this math problem! I'm here to help you solve it."

Remember: Help ${studentName} UNDERSTAND, not just get the answer. Make them feel smart and capable!`;

  // Build messages array with system prompt
  const apiMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.map((m: Message) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: apiMessages,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
