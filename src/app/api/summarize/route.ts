import { NextRequest, NextResponse } from 'next/server';
import { geminiGenerate } from '@/lib/geminiClient';

export async function POST(req: NextRequest) {
  try {
    const { problem, turns, votedPersona, session_id } = await req.json();

    if (!problem || !session_id) {
      return NextResponse.json(
        { error: 'problem and session_id are required' },
        { status: 400 }
      );
    }

    const summaryPrompt = `Summarize this AI counseling session in exactly 2 sentences.
Focus on: what the person was struggling with, and which perspective they chose.

Problem: "${problem}"
Voted persona: ${votedPersona || 'none'}
Number of turns: ${Array.isArray(turns) ? turns.length : 0}

Write 2 sentences only. No lists. No headers. Plain text.`;

    const summary = await geminiGenerate(summaryPrompt, { maxTokens: 150 });

    console.log(`[Summary] session: ${session_id.slice(0, 8)} | ${summary.slice(0, 60)}...`);

    return NextResponse.json({ summary, session_id });
  } catch (error: any) {
    console.error('[Summary] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Summary generation failed' },
      { status: 500 }
    );
  }
}
