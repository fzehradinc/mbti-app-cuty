'use client';

import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';

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
                    const char = getCharacterByMbti(mbti);
                    if (!char) return null;
                    const isSelected = selectedVote === mbti;

                    return (
                        <motion.button
                            key={mbti}
                            onClick={() => onVote(mbti)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 min-w-[80px]"
                            style={{
                                background: isSelected ? `${char.color}20` : 'var(--bg-card)',
                                border: isSelected ? `2px solid ${char.color}` : '2px solid var(--border-subtle)',
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div
                                className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold transition-all"
                                style={{
                                    background: isSelected ? char.color : `${char.color}20`,
                                    color: isSelected ? 'white' : char.color,
                                }}
                            >
                                {mbti.substring(0, 2)}
                            </div>
                            <span
                                className="text-xs font-medium tracking-wider"
                                style={{ color: isSelected ? char.color : 'var(--text-secondary)' }}
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
