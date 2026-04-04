'use client';

import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import CharacterAvatar from './CharacterAvatar';

interface CharacterCardProps {
    mbti: string;
    isSelected: boolean;
    onToggle: () => void;
    index: number;
}

export default function CharacterCard({ mbti, isSelected, onToggle, index }: CharacterCardProps) {
    const character = getCharacterByMbti(mbti);
    const visuals = CHARACTER_VISUALS[mbti];
    if (!character || !visuals) return null;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.4 }}
            onClick={onToggle}
            className="relative rounded-2xl p-3 text-center transition-all duration-300 group"
            style={{
                background: isSelected ? `${visuals.bg}80` : 'rgba(255,255,255,0.02)',
                border: isSelected
                    ? `1.5px solid ${visuals.accentColor}`
                    : '1px solid rgba(255,255,255,0.08)',
                transform: isSelected ? 'scale(1.03)' : 'scale(1)',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
        >
            {/* Selection indicator */}
            {isSelected && (
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs text-white"
                    style={{ background: visuals.accentColor }}
                >
                    ✓
                </motion.div>
            )}

            <div className="flex flex-col items-center">
                <CharacterAvatar mbti={mbti} size="md" showLabel isSelected={isSelected} />
                <div className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    {visuals.tagline}
                </div>
            </div>
        </motion.button>
    );
}
