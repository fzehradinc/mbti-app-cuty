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

        // Collect all user messages for pattern analysis
        const userMessages = turns
            .filter((t: any) => t.userMessage)
            .map((t: any) => t.userMessage)
            .join(' | ');

        const prompt = `
You are a master psychologist analyzing a decision-making consultation. Your job is to generate a final report that creates a moment of unexpected self-insight for the user.

ORIGINAL PROBLEM: "${problem}"

FULL DISCUSSION:
${turns.map((t: any) => `
Round ${t.turnNumber}:
${Object.entries(t.responses).map(([mbti, r]: any) => `${mbti}: ${r.message}`).join('\n')}
User voted for: ${t.userVote}
User said: "${t.userMessage}"
`).join('\n\n')}

USER'S VOTING PATTERN: ${JSON.stringify(voteCounts)}
DOMINANT VOTE: ${dominantVote}
ALL USER MESSAGES: "${userMessages}"

---

REPORT GENERATION RULES:

1. CORE TENSION: Identify the fundamental conflict. Not a summary of the conversation — the UNDERLYING tension the user hasn't fully named. What are they really torn between? (2 sentences, Turkish)

2. CHARACTER POSITIONS: Each character's FINAL stance — not a recap of what they said, but where they'd land if forced to give a single verdict. (1 sentence each, Turkish)

3. ACTION PATHS: Three CONCRETE action items that are specific to THIS user's situation. Not generic advice. Each path should be a different philosophical approach:
   - Path 1: Aligned with ${dominantVote}'s worldview
   - Path 2: A surprising middle ground nobody proposed
   - Path 3: The uncomfortable truth path

4. USER INSIGHT (MOST IMPORTANT): This is the "moment of unexpected self-insight." Analyze the user's voting pattern AND their messages to reveal something about themselves they didn't fully know. Look for:
   - Contradictions between what they say and how they vote
   - Patterns in which character types they gravitate toward
   - What their word choices reveal about their real fear/desire
   This must be SPECIFIC, not generic. It should create the feeling of "How did it know that?" (3-4 sentences, Turkish)

5. NEXT STEP: The single most important thing they can do THIS WEEK. Must be specific, actionable, and completable in under 2 hours. (Turkish)

Respond in Turkish. Return ONLY this JSON structure, no other text:
{
  "coreTension": "string",
  "characterPositions": {
    ${selectedCharacters.map((c: string) => `"${c}": "string"`).join(',\n    ')}
  },
  "actionPaths": [
    "string",
    "string",
    "string"
  ],
  "userInsight": "string",
  "nextStep": "string"
}
`;

        const message = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1500,
            messages: [{ role: 'user', content: prompt }],
        });

        // Cost tracking
        const inputTokens = message.usage?.input_tokens || 0;
        const outputTokens = message.usage?.output_tokens || 0;
        const cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
        console.log(`[Cost] Claude Report: $${cost.toFixed(6)} | in:${inputTokens} out:${outputTokens}`);

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
