'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTERS } from '@/data/characters';
import type { AppScreen } from '@/app/page';

interface InviteAnimationProps {
    onNavigate: (screen: AppScreen) => void;
}

export default function InviteAnimation({ onNavigate }: InviteAnimationProps) {
    const activeSession = useSessionStore(state => {
        const id = state.activeSessionId;
        if (!id) return null;
        return state.sessions.find(s => s.sessionId === id) ?? null;
    });
    const selectedCharacters = activeSession?.selectedCharacters ?? [];
    const [visibleCount, setVisibleCount] = useState(0);
    const [statusText, setStatusText] = useState('Ekip toplanıyor...');

    useEffect(() => {
        const interval = setInterval(() => {
            setVisibleCount(prev => {
                if (prev >= selectedCharacters.length) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, 400);

        return () => clearInterval(interval);
    }, [selectedCharacters.length]);

    useEffect(() => {
        if (visibleCount >= selectedCharacters.length) {
            setTimeout(() => setStatusText('SİNERJİ ANALİZİ YAPILIYOR'), 500);
            setTimeout(() => setStatusText('Hazır. Danışmaya başlayalım.'), 1800);
            setTimeout(() => {
                onNavigate('discussion');
            }, 2800);
        }
    }, [visibleCount, selectedCharacters.length, onNavigate]);

    const getCharPos = (index: number, total: number) => {
        const angleStart = -60;
        const angleEnd = 60;
        const angleStep = total > 1 ? (angleEnd - angleStart) / (total - 1) : 0;
        const angle = total > 1 ? angleStart + angleStep * index : 0;
        const rad = (angle * Math.PI) / 180;
        const radius = 130;

        return {
            x: Math.sin(rad) * radius,
            y: -Math.cos(rad) * radius * 0.5 + 30,
        };
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden">
            {/* Background particles */}
            <div className="absolute inset-0 pointer-events-none">
                {selectedCharacters.map((mbti, i) => {
                    const char = CHARACTERS.find(c => c.mbti === mbti);
                    return (
                        <motion.div
                            key={`bg-${mbti}`}
                            className="absolute w-32 h-32 rounded-full blur-3xl"
                            style={{
                                background: char?.color || '#7C3AED',
                                opacity: 0.05,
                                left: `${20 + i * 15}%`,
                                top: `${30 + i * 10}%`,
                            }}
                            animate={{
                                x: [0, 30, -20, 0],
                                y: [0, -20, 30, 0],
                            }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                        />
                    );
                })}
            </div>

            {/* Characters circle */}
            <div className="relative w-80 h-72 mb-8">
                <AnimatePresence>
                    {selectedCharacters.slice(0, visibleCount).map((mbti, i) => {
                        const char = CHARACTERS.find(c => c.mbti === mbti);
                        const pos = getCharPos(i, selectedCharacters.length);

                        return (
                            <motion.div
                                key={mbti}
                                initial={{ y: 200, opacity: 0, scale: 0.5 }}
                                animate={{
                                    x: pos.x + 120,
                                    y: pos.y + 60,
                                    opacity: 1,
                                    scale: 1,
                                }}
                                transition={{
                                    type: 'spring',
                                    stiffness: 200,
                                    damping: 20,
                                }}
                                className="absolute flex flex-col items-center"
                            >
                                {/* Glow */}
                                <motion.div
                                    className="absolute w-24 h-24 rounded-full blur-xl"
                                    style={{ background: char?.color || '#7C3AED' }}
                                    animate={{ opacity: [0.1, 0.3, 0.1] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                />

                                {/* Avatar */}
                                <div
                                    className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold border-2 mb-2"
                                    style={{
                                        background: `${char?.color}20`,
                                        borderColor: `${char?.color}60`,
                                        color: char?.color,
                                    }}
                                >
                                    {mbti.substring(0, 2)}
                                </div>

                                {/* Label */}
                                <p className="text-xs font-bold tracking-wider" style={{ color: char?.color }}>
                                    {mbti}
                                </p>
                                <p className="text-[10px] text-[var(--text-secondary)] italic">
                                    {char?.name}
                                </p>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Status text */}
            <motion.div className="text-center relative z-10">
                <motion.h2
                    key={statusText}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    {statusText}
                </motion.h2>

                {visibleCount < selectedCharacters.length && (
                    <div className="flex justify-center gap-1.5 mt-4">
                        {[0, 1, 2].map(i => (
                            <motion.div
                                key={i}
                                className="w-2 h-2 rounded-full bg-[var(--accent)]"
                                animate={{ opacity: [0.2, 1, 0.2] }}
                                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                            />
                        ))}
                    </div>
                )}
            </motion.div>
        </div>
    );
}
