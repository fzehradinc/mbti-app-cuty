'use client';

import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';

interface CharacterMessageProps {
    mbti: string;
    message: string;
    quote: string;
    index: number;
}

export default function CharacterMessage({ mbti, message, quote, index }: CharacterMessageProps) {
    const character = getCharacterByMbti(mbti);
    const visuals = CHARACTER_VISUALS[mbti];
    if (!character) return null;
    const accent = visuals?.accentColor || character.color;
    const bg = visuals?.bg || `${character.color}20`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.15, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
        >
            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
                <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                    style={{
                        background: bg,
                        border: `1px solid ${accent}40`,
                    }}
                >
                    {visuals?.emoji || mbti.substring(0, 2)}
                </div>
                <div>
                    <span
                        className="text-xs tracking-[0.15em] uppercase font-medium"
                        style={{ color: accent }}
                    >
                        {mbti}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] ml-2">
                        — {visuals?.label || character.name}
                    </span>
                </div>
            </div>

            {/* Message body */}
            <div
                className="rounded-xl p-4 ml-2"
                style={{
                    background: 'var(--bg-card)',
                    borderLeft: `3px solid ${accent}`,
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
                    style={{ borderLeft: `2px solid ${accent}40` }}
                >
                    <p className="quote-text text-xs text-[var(--text-secondary)] italic leading-relaxed">
                        {quote}
                    </p>
                </div>
            )}
        </motion.div>
    );
}
