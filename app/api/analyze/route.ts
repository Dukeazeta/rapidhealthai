import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { age, symptoms, duration } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key not configured' }, { status: 500 });
    }

    const prompt = `
      You are a medical diagnostic assistant for Community Health Volunteers in rural areas.
      Analyze the following patient data and provide a diagnosis:
      Age: ${age}
      Symptoms: ${symptoms}
      Duration of illness: ${duration}

      Return the response in JSON format with the following fields:
      - likelyDisease: (string)
      - riskLevel: (string: "Low", "Medium", or "High")
      - keySigns: (array of strings)
      - immediateAction: (string)
      - urgentReferral: (boolean)

      Be concise and professional.
    `;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          }
        }),
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to call Gemini API');
    }

    const resultText = data.candidates[0].content.parts[0].text;
    const result = JSON.parse(resultText);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
