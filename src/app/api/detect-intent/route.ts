import { NextRequest, NextResponse } from 'next/server';
import { geminiGenerate } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const { userMessage, problem, conversationHistory } = await req.json();

    if (!userMessage || !problem) {
      return NextResponse.json(
        { error: 'userMessage and problem are required' },
        { status: 400 }
      );
    }

    const intentPrompt = `Classify this user message into exactly one category.

User message: "${userMessage}"
Current conversation topic: "${problem}"
Has previous turns: ${Array.isArray(conversationHistory) && conversationHistory.length > 0}

Categories:
- follow_up: continuing the same conversation
- new_topic: wants to discuss something different
- emotional: venting, needs acknowledgment
- clarification: asking what was meant

Respond with ONLY a JSON object, nothing else:
{"type": "follow_up", "confidence": 0.9, "shouldContinue": true}`;

    const raw = await geminiGenerate(intentPrompt, { maxTokens: 100, temperature: 0.1 });
    console.log(`[Intent] Raw Gemini response: "${raw}"`);

    // Try to parse JSON from various formats
    const clean = raw.replace(/```json\n?|```/g, '').trim();
    let intent;
    try {
      intent = JSON.parse(clean);
    } catch {
      // If Gemini returned just a category name, wrap it
      const validTypes = ['follow_up', 'new_topic', 'emotional', 'clarification'];
      const matchedType = validTypes.find(t => clean.toLowerCase().includes(t));
      intent = {
        type: matchedType || 'follow_up',
        confidence: 0.7,
        shouldContinue: matchedType !== 'new_topic',
      };
    }

    console.log(`[Intent] type: ${intent.type} | confidence: ${intent.confidence} | continue: ${intent.shouldContinue}`);

    return NextResponse.json(intent);
  } catch (error: any) {
    console.error('[Intent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Intent detection failed' },
      { status: 500 }
    );
  }
}
