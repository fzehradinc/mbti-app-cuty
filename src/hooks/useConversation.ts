'use client';

import { useState, useCallback } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import { buildAPIContext } from '@/lib/buildAPIContext';
import { ConversationTurn } from '@/types/conversation';
import { MOCK_RESPONSES } from '@/data/characters';
import { trackEvent } from '@/lib/analytics';

function buildMockResponses(characters: string[]): Record<string, { message: string; quote: string }> {
    const responses: Record<string, { message: string; quote: string }> = {};
    characters.forEach(mbti => {
        if (MOCK_RESPONSES[mbti]) {
            responses[mbti] = MOCK_RESPONSES[mbti];
        } else {
            responses[mbti] = {
                message: `${mbti} olarak, bu konuda düşüncelerimi paylaşmak isterim. Durumunuzu dikkatle değerlendirdim.`,
                quote: '"Her adım, doğru yöne atıldığında anlamlıdır." — Anonim',
            };
        }
    });
    return responses;
}

export function useConversation() {
    const [isLoading, setIsLoading] = useState(false);

    const {
        getActiveSession,
        addTurnToSession,
        setSessionStatus,
    } = useSessionStore();

    // Round 1: All selected characters respond
    const triggerRound1 = useCallback(async () => {
        const session = getActiveSession();
        if (!session) {
            console.error('No active session for Round 1');
            return;
        }

        setSessionStatus('round1_loading');
        setIsLoading(true);

        const context = buildAPIContext(session, 'round1');

        console.log('[Round1] Sending to API:', {
            session_id: context.conversation_id,
            problem: context.problem.slice(0, 50),
            historyLength: context.history.length,
            round: context.currentRound,
        });

        try {
            const response = await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem: context.problem,
                    characters: context.selectedCharacters,
                    conversationHistory: context.history,
                    conversationId: context.conversation_id,
                    userVote: null,
                    userMessage: '',
                    turnNumber: context.currentRound,
                    roundType: 'round1',
                }),
            });

            let responses: Record<string, { message: string; quote: string }>;

            if (!response.ok) {
                console.warn('API failed, using mock data');
                responses = buildMockResponses(context.selectedCharacters);
            } else {
                const data = await response.json();
                responses = Object.fromEntries(
                    data.responses.map((r: { mbti: string; message: string; quote: string }) => [r.mbti, { message: r.message, quote: r.quote }])
                );
            }

            const newTurn: ConversationTurn = {
                turnNumber: context.currentRound,
                roundType: 'round1',
                userVote: null,
                userMessage: '',
                responses,
                selectedPersona: null,
                continuationPersonas: [],
                createdAt: new Date(),
            };

            addTurnToSession(newTurn);
            setSessionStatus('round1_ready');
            trackEvent('round1_completed', {
                character_count: context.selectedCharacters.length,
                characters: context.selectedCharacters.join(','),
            });
            setTimeout(() => setSessionStatus('awaiting_vote'), 100);
            return newTurn;
        } catch (error) {
            console.error('Round 1 failed, using mock fallback:', error);
            const responses = buildMockResponses(context.selectedCharacters);
            const newTurn: ConversationTurn = {
                turnNumber: context.currentRound,
                roundType: 'round1',
                userVote: null,
                userMessage: '',
                responses,
                selectedPersona: null,
                continuationPersonas: [],
                createdAt: new Date(),
            };
            addTurnToSession(newTurn);
            setSessionStatus('round1_ready');
            trackEvent('round1_completed', {
                character_count: context.selectedCharacters.length,
                characters: context.selectedCharacters.join(','),
                fallback: true,
            });
            setTimeout(() => setSessionStatus('awaiting_vote'), 100);
            return newTurn;
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSession, addTurnToSession, setSessionStatus]);

    // Round 2: Active persona + continuation personas respond
    const triggerRound2 = useCallback(async (userMessage: string) => {
        const session = getActiveSession();
        if (!session) {
            console.error('No active session for Round 2');
            return;
        }
        if (!session.activePersona) {
            console.warn('Cannot trigger Round 2 without an active persona');
            return;
        }

        const continuationPersonas = session.continuationPersonas?.length
            ? session.continuationPersonas
            : [session.activePersona];

        setSessionStatus('round2_loading');
        setIsLoading(true);

        const context = buildAPIContext(session, 'round2');

        console.log('[Round2] Sending to API:', {
            session_id: context.conversation_id,
            problem: context.problem.slice(0, 50),
            historyLength: context.history.length,
            round: context.currentRound,
            activePersona: session.activePersona,
            continuationPersonas,
        });

        try {
            const response = await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem: context.problem,
                    characters: continuationPersonas,
                    conversationHistory: context.history,
                    conversationId: context.conversation_id,
                    userVote: session.activePersona,
                    userMessage,
                    turnNumber: context.currentRound,
                    roundType: 'round2',
                    continuationPersonas,
                }),
            });

            let responses: Record<string, { message: string; quote: string }>;

            if (!response.ok) {
                console.warn('API failed for Round 2, using mock data');
                responses = buildMockResponses(continuationPersonas);
            } else {
                const data = await response.json();
                responses = Object.fromEntries(
                    data.responses.map((r: { mbti: string; message: string; quote: string }) => [r.mbti, { message: r.message, quote: r.quote }])
                );
            }

            const newTurn: ConversationTurn = {
                turnNumber: context.currentRound,
                roundType: 'round2',
                userVote: session.activePersona,
                userMessage,
                responses,
                selectedPersona: session.activePersona,
                continuationPersonas,
                createdAt: new Date(),
            };

            addTurnToSession(newTurn);
            setSessionStatus('round2_ready');
            trackEvent('round2_completed', {
                session_id: context.conversation_id,
            });
            setTimeout(() => setSessionStatus('awaiting_deeper_or_report'), 100);
            return newTurn;
        } catch (error) {
            console.error('Round 2 failed, using mock fallback:', error);
            const responses = buildMockResponses(continuationPersonas);
            const newTurn: ConversationTurn = {
                turnNumber: context.currentRound,
                roundType: 'round2',
                userVote: session.activePersona,
                userMessage,
                responses,
                selectedPersona: session.activePersona,
                continuationPersonas,
                createdAt: new Date(),
            };
            addTurnToSession(newTurn);
            setSessionStatus('round2_ready');
            trackEvent('round2_completed', {
                session_id: context.conversation_id,
                fallback: true,
            });
            setTimeout(() => setSessionStatus('awaiting_deeper_or_report'), 100);
            return newTurn;
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSession, addTurnToSession, setSessionStatus]);

    // Generate report
    const generateReport = useCallback(async () => {
        const session = getActiveSession();
        if (!session) {
            console.error('No active session for report');
            throw new Error('No active session');
        }

        setSessionStatus('report_loading');
        setIsLoading(true);

        try {
            const response = await fetch('/api/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    problem: session.problem,
                    turns: session.turns,
                    selectedCharacters: session.selectedCharacters,
                    activePersona: session.activePersona,
                    conversationId: session.sessionId,
                }),
            });

            if (!response.ok) throw new Error('Failed to generate report');
            const report = await response.json();
            setSessionStatus('report_ready');
            return report;
        } catch (error) {
            console.error('Report generation failed:', error);
            setSessionStatus('awaiting_deeper_or_report');
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, [getActiveSession, setSessionStatus]);

    return {
        isLoading,
        triggerRound1,
        triggerRound2,
        generateReport,
    };
}
