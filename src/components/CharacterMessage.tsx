'use client';

import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';

interface CharacterMessageProps {
    mbti: string;
    message: string;
    quote: string;
    index: number;
}

export default function CharacterMessage({ mbti, message, quote, index }: CharacterMessageProps) {
    const character = getCharacterByMbti(mbti);
    if (!character) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.5 }}
            className="mb-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{
                        background: `${character.color}20`,
                        color: character.color,
                        border: `1px solid ${character.color}40`,
                    }}
                >
                    {mbti.substring(0, 2)}
                </div>
                <div>
                    <span
                        className="text-xs tracking-[0.15em] uppercase font-medium"
                        style={{ color: character.color }}
                    >
                        {mbti}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                        — {character.name}
                    </span>
                </div>
            </div>

            {/* Message body */}
            <div
                className="rounded-xl p-4 ml-2"
                style={{
                    background: 'var(--bg-card)',
                    borderLeft: `3px solid ${character.color}`,
                }}
            >
                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                    {message}
                </p>
            </div>

            {/* Quote */}
            {quote && (
                <div
                    className="ml-2 mt-2 pl-4"
                    style={{ borderLeft: `2px solid ${character.color}40` }}
                >
                    <p className="quote-text text-xs text-[var(--text-secondary)] italic leading-relaxed">
                        {quote}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
