export async function POST(req: Request) {
  const { text } = await req.json();

  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set');
    return new Response(JSON.stringify({ error: 'API key not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: 'nova',
        speed: 0.95,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI TTS error:', response.status, errorText);
      return new Response(JSON.stringify({ error: errorText }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(JSON.stringify({ error: 'TTS request failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
