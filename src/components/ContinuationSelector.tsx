'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { getCharacterByMbti } from '@/data/characters';

interface ContinuationSelectorProps {
    allCharacters: string[];
    votedPersona: string;
    onConfirm: (selected: string[]) => void;
}

export default function ContinuationSelector({ allCharacters, votedPersona, onConfirm }: ContinuationSelectorProps) {
    const [selected, setSelected] = useState<string[]>([votedPersona]);
    const [shake, setShake] = useState(false);

    const toggle = (mbti: string) => {
        if (mbti === votedPersona) return; // locked
        if (selected.includes(mbti)) {
            setSelected(selected.filter(s => s !== mbti));
        } else if (selected.length >= 3) {
            setShake(true);
            setTimeout(() => setShake(false), 500);
        } else {
            setSelected([...selected, mbti]);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
        >
            <p className="text-sm tracking-[0.1em] uppercase font-medium text-[var(--text-secondary)] mb-2">
                KİMLER DEVAM ETSİN?
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
                Oyladığın karakter sabit. En fazla 2 karakter daha ekleyebilirsin.
            </p>

            <motion.div
                className="flex gap-3 flex-wrap"
                animate={shake ? { x: [-6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
            >
                {allCharacters.map((mbti) => {
                    const char = getCharacterByMbti(mbti);
                    if (!char) return null;
                    const isVoted = mbti === votedPersona;
                    const isSelected = selected.includes(mbti);

                    return (
                        <motion.button
                            key={mbti}
                            onClick={() => toggle(mbti)}
                            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 min-w-[80px] relative"
                            style={{
                                background: isSelected ? `${char.color}20` : 'var(--bg-card)',
                                border: isSelected ? `2px solid ${char.color}` : '2px solid var(--border-subtle)',
                                cursor: isVoted ? 'default' : 'pointer',
                                opacity: isVoted ? 1 : undefined,
                            }}
                            whileHover={isVoted ? {} : { scale: 1.05 }}
                            whileTap={isVoted ? {} : { scale: 0.95 }}
                        >
                            {isVoted && (
                                <span className="absolute -top-2 -right-2 text-xs bg-[var(--accent-start)] text-white px-1.5 py-0.5 rounded-full">
                                    ★
                                </span>
                            )}
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
            </motion.div>

            <motion.button
                onClick={() => onConfirm(selected)}
                className="mt-5 px-6 py-2.5 rounded-xl text-sm font-medium text-white"
                style={{ background: 'var(--accent-start)' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
            >
                Devam Et →
            </motion.button>
        </motion.div>
    );
}
