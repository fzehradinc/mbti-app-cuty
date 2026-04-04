import { SessionData } from '@/store/sessionStore';

export interface APIContext {
    conversation_id: string;
    problem: string;
    selectedCharacters: string[];
    activePersona: string | null;
    currentRound: number;
    roundType: 'round1' | 'round2';
    history: {
        round: string;
        responses: Record<string, { message: string; quote: string }>;
        selectedPersona: string | null;
        userMessage: string;
    }[];
}

/**
 * Build API context from a SINGLE session.
 * This function guarantees context isolation — it ONLY reads from the passed session.
 * Never accesses global state, never merges data from other sessions.
 */
export function buildAPIContext(session: SessionData, roundType: 'round1' | 'round2'): APIContext {
    const continuationPersonas = session.continuationPersonas ?? [];
    return {
        conversation_id: session.sessionId,
        problem: session.problem,
        selectedCharacters: roundType === 'round2' && session.activePersona
            ? (continuationPersonas.length > 0 ? continuationPersonas : [session.activePersona])
            : session.selectedCharacters,
        activePersona: session.activePersona,
        currentRound: session.turns.length + 1,
        roundType,
        history: session.turns.map(turn => ({
            round: turn.roundType,
            responses: turn.responses,
            selectedPersona: turn.selectedPersona,
            userMessage: turn.userMessage,
        })),
    };
}
