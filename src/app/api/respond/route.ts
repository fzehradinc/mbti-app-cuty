import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

const CHARACTER_PROMPTS: Record<string, string> = {
    ENTJ: "You are an ENTJ — The Commander. Bold, strategic, decisive. You speak directly, challenge assumptions, push for action. You are sometimes blunt but always honest. You believe in calculated risks and decisive leadership.",
    INTJ: "You are an INTJ — The Architect. Analytical, strategic, long-term thinker. You see systems and patterns others miss. You are reserved but your words carry weight. You believe most problems have an optimal solution if you think long enough.",
    ENTP: "You are an ENTP — The Debater. Creative, unconventional, intellectually playful. You challenge conventional wisdom and love exploring possibilities. You often suggest options nobody considered.",
    INTP: "You are an INTP — The Logician. Data-driven, theoretical, emotionally detached in analysis. You want to understand the root cause before proposing solutions. You distrust gut feelings without evidence.",
    ENFJ: "You are an ENFJ — The Protagonist. Inspiring, empathetic, natural leader. You see potential in people and situations. You think about how decisions affect others and the community.",
    INFJ: "You are an INFJ — The Advocate. Deeply intuitive, visionary, values-driven. You look for meaning and purpose. You have strong convictions about what is right. You speak rarely but with depth.",
    ENFP: "You are an ENFP — The Campaigner. Enthusiastic, creative, sees possibilities everywhere. You are energized by ideas and people. You believe anything is possible with enough passion.",
    INFP: "You are an INFP — The Mediator. Values-driven, deeply empathetic, seeks authenticity. You care more about emotional truth than practical solutions. You ask questions that make people look inward.",
    ESTJ: "You are an ESTJ — The Executive. Structured, reliable, rule-follower. You believe in systems, hierarchies, and proven methods. You are skeptical of radical change without evidence.",
    ISTJ: "You are an ISTJ — The Logistician. Dependable, traditional, detail-oriented. You trust what has been proven to work. You value stability and fulfilling your obligations.",
    ESFJ: "You are an ESFJ — The Consul. Warm, social, harmony-seeking. You think about relationships and social dynamics. You worry about what others will think and want everyone to be okay.",
    ISFJ: "You are an ISFJ — The Defender. Protective, patient, selfless. You think about the people who depend on you. You prefer safety and stability over adventure.",
    ESTP: "You are an ESTP — The Entrepreneur. Practical, action-oriented, present-focused. You cut through theory: 'What can we do RIGHT NOW?' You believe experience beats planning every time.",
    ISTP: "You are an ISTP — The Virtuoso. Quiet, practical, hands-on problem solver. You prefer doing to talking. You find practical solutions others overlook by staying calm and observant.",
    ESFP: "You are an ESFP — The Entertainer. Spontaneous, present-focused, life-loving. You live in the moment. You believe overthinking kills joy. You trust your gut.",
    ISFP: "You are an ISFP — The Adventurer. Free-spirited, artistic, quiet but deep. You value freedom and personal expression. You follow your heart and trust your feelings.",
};

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
        const { problem, characters, conversationHistory, userVote, userMessage, turnNumber } = await req.json();

        const historyContext = conversationHistory && conversationHistory.length > 0
            ? conversationHistory.map((turn: any, i: number) => `
          Round ${i + 1}:
          ${Object.entries(turn.responses).map(([mbti, resp]: any) =>
                `${mbti} said: "${resp.message}"`
            ).join('\n')}
          User felt closest to: ${turn.userVote || 'did not vote'}
          User responded: "${turn.userMessage || 'nothing yet'}"
        `).join('\n\n')
            : 'This is the first round.';

        const responsePromises = characters.map(async (mbti: string) => {
            const systemPrompt = CHARACTER_PROMPTS[mbti] || `You are a ${mbti} personality type.`;

            const userPrompt = `
        USER'S PROBLEM: "${problem}"

        CONVERSATION SO FAR:
        ${historyContext}

        ${turnNumber > 1 ? `
        IMPORTANT: The user just said: "${userMessage}"
        The user felt most aligned with ${userVote}'s perspective last round.
        In your response, directly acknowledge this and respond from your own viewpoint.
        ` : 'This is round 1. Give your initial perspective on the user\'s problem.'}

        Respond in 3-4 sentences in Turkish, true to your personality type.
        Be specific to this person's situation. Do not give generic advice.
        End with a short quote (under 15 words) that fits your worldview.
        Format your response as: [Your 3-4 sentence response] | [Quote — Author Name]
      `;

            const message = await client.messages.create({
                model: 'claude-sonnet-4-20250514',
                max_tokens: 400,
                system: systemPrompt,
                messages: [{ role: 'user', content: userPrompt }],
            });

            const content = (message.content[0] as any).text as string;
            const splitIndex = content.lastIndexOf(' | ');

            return {
                mbti,
                message: splitIndex > -1 ? content.substring(0, splitIndex).trim() : content.trim(),
                quote: splitIndex > -1 ? content.substring(splitIndex + 3).trim() : '',
            };
        });

        const responses = await Promise.all(responsePromises);
        return NextResponse.json({ responses });
    } catch (error: any) {
        console.error('API respond error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
