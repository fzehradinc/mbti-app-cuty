'use client';

import { useState, useCallback } from 'react';
import { Turn } from '@/types';

export function useConversation() {
    const [turns, setTurns] = useState<Turn[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const submitTurn = useCallback(async (params: {
        problem: string;
        characters: string[];
        userVote: string | null;
        userMessage: string;
    }) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/respond', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...params,
                    conversationHistory: turns,
                    turnNumber: turns.length + 1,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get responses');
            }

            const { responses } = await response.json();

            const newTurn: Turn = {
                turnNumber: turns.length + 1,
                userVote: params.userVote,
                userMessage: params.userMessage,
                responses: Object.fromEntries(
                    responses.map((r: any) => [r.mbti, { message: r.message, quote: r.quote }])
                ),
                createdAt: new Date(),
            };

            setTurns(prev => [...prev, newTurn]);
            return newTurn;
        } finally {
            setIsLoading(false);
        }
    }, [turns]);

    const generateReport = useCallback(async (problem: string, selectedCharacters: string[]) => {
        const response = await fetch('/api/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ problem, turns, selectedCharacters }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        return response.json();
    }, [turns]);

    const resetConversation = useCallback(() => {
        setTurns([]);
    }, []);

    return { turns, submitTurn, generateReport, resetConversation, isLoading };
}
