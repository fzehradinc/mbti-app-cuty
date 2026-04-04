'use client';

import { motion } from 'framer-motion';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';

interface VoteSelectorProps {
    characters: string[];
    onVote: (mbti: string) => void;
    selectedVote: string | null;
}

export default function VoteSelector({ characters, onVote, selectedVote }: VoteSelectorProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
        >
            <p className="text-sm tracking-[0.1em] uppercase font-medium text-[var(--text-secondary)] mb-4">
                KİMİN GÖRÜŞÜNE DAHA YAKINSIN?
            </p>

            <div className="flex gap-3 flex-wrap">
                {characters.map((mbti) => {
                    const vis = CHARACTER_VISUALS[mbti];
                    if (!vis) return null;
                    const isSelected = selectedVote === mbti;

                    return (
                        <motion.button
                            key={mbti}
                            onClick={() => onVote(mbti)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300"
                            style={{
                                minHeight: 64,
                                minWidth: 80,
                                background: isSelected ? vis.bg : 'var(--bg-card)',
                                border: isSelected ? `2px solid ${vis.accentColor}` : '2px solid var(--border-subtle)',
                                boxShadow: isSelected ? `0 0 12px ${vis.accentColor}40` : 'none',
                                WebkitTapHighlightColor: 'transparent',
                                userSelect: 'none' as const,
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-lg transition-all"
                                style={{
                                    background: isSelected ? vis.accentColor : vis.bg,
                                    border: `1px solid ${vis.accentColor}40`,
                                }}
                            >
                                {vis.emoji}
                            </div>
                            <span
                                className="text-xs font-medium tracking-wider"
                                style={{ color: isSelected ? vis.accentColor : 'var(--text-secondary)' }}
                            >
                                {mbti}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </motion.div>
    );
}
