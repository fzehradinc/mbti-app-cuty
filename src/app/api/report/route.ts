import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { error: 'Anthropic API key is not configured' },
            { status: 500 }
        );
    }

    const client = new Anthropic({ apiKey });

    try {
        const { problem, turns, selectedCharacters } = await req.json();

        const voteCounts: Record<string, number> = {};
        turns.forEach((t: any) => {
            if (t.userVote) voteCounts[t.userVote] = (voteCounts[t.userVote] || 0) + 1;
        });
        const dominantVote = Object.entries(voteCounts).sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || 'unclear';

        const prompt = `
      Based on this decision-making consultation, write a final report as JSON.
      Respond in Turkish.

      ORIGINAL PROBLEM: "${problem}"

      FULL DISCUSSION:
      ${turns.map((t: any) => `
        Round ${t.turnNumber}:
        ${Object.entries(t.responses).map(([mbti, r]: any) => `${mbti}: ${r.message}`).join('\n')}
        User voted for: ${t.userVote}
        User said: ${t.userMessage}
      `).join('\n\n')}

      USER'S DOMINANT VOTE: ${dominantVote}

      Return ONLY this JSON structure, no other text:
      {
        "coreTension": "1-2 sentences describing the core conflict in Turkish",
        "characterPositions": {
          ${selectedCharacters.map((c: string) => `"${c}": "final position in 1 sentence in Turkish"`).join(',\n')}
        },
        "actionPaths": [
          "Path 1 (aligned with ${dominantVote}'s approach): specific concrete action in Turkish",
          "Path 2 (middle ground): specific concrete action in Turkish",
          "Path 3 (alternative view): specific concrete action in Turkish"
        ],
        "userInsight": "What their voting pattern reveals about their true leaning (2-3 sentences in Turkish)",
        "nextStep": "Single most important thing they can do THIS WEEK in Turkish"
      }
    `;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
        });

        const text = (message.content[0] as any).text as string;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const report = JSON.parse(jsonMatch ? jsonMatch[0] : text);

        return NextResponse.json(report);
    } catch (error: any) {
        console.error('API report error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
