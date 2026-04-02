'use client';

import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';

interface CharacterCardProps {
    mbti: string;
    isSelected: boolean;
    onToggle: () => void;
    index: number;
}

export default function CharacterCard({ mbti, isSelected, onToggle, index }: CharacterCardProps) {
    const character = getCharacterByMbti(mbti);
    if (!character) return null;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            onClick={onToggle}
            className="relative rounded-xl p-4 text-left transition-all duration-300 group"
            style={{
                background: isSelected
                    ? `linear-gradient(135deg, ${character.color}15, ${character.color}08)`
                    : 'var(--bg-card)',
                border: isSelected
                    ? `2px solid ${character.color}`
                    : '2px solid var(--border-subtle)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Selection indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs"
                    style={{ background: character.color }}
                >
                    ✓
                </motion.div>
            )}

            {/* Avatar circle */}
            <div
                className="w-14 h-14 rounded-lg flex items-center justify-center mb-3 mx-auto text-xl font-bold transition-all duration-300"
                style={{
                    background: `${character.color}20`,
                    color: character.color,
                    border: `1px solid ${character.color}40`,
                }}
            >
                {mbti[0]}
            </div>

            {/* MBTI code */}
            <p className="font-bold text-sm text-center tracking-wider text-[var(--text-primary)]">
                {mbti}
            </p>

            {/* Role name */}
            <p
                className="text-xs text-center font-medium mt-1 uppercase tracking-wider"
                style={{ color: character.color }}
            >
                {character.name}
            </p>

            {/* Description */}
            <p className="text-[10px] text-center text-[var(--text-secondary)] mt-2 leading-relaxed">
                {character.description}
            </p>
        </motion.button>
    );
}
