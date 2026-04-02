'use client';

import { motion } from 'framer-motion';
import { CHARACTERS } from '@/data/characters';

interface ProblemCardProps {
    problem: string;
    characters: string[];
}

export default function ProblemCard({ problem, characters }: ProblemCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl p-4"
            style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
            }}
        >
            {/* Character avatars */}
            <div className="flex -space-x-2 mb-3">
                {characters.map((mbti) => {
                    const char = CHARACTERS.find(c => c.mbti === mbti);
                    return (
                        <div
                            key={mbti}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 border-[var(--bg-card)]"
                            style={{ background: char?.color || '#7C3AED' }}
                        >
                            {mbti[0]}
                        </div>
                    );
                })}
            </div>

            {/* Problem text */}
            <p className="text-sm text-[var(--text-primary)] leading-relaxed italic">
                &ldquo;{problem}&rdquo;
            </p>
        </motion.div>
    );
}
