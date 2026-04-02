'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

export default function WelcomeScreen() {
    const { problem, setProblem, setScreen } = useAppStore();
    const [charCount, setCharCount] = useState(problem.length);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 500) {
            setProblem(value);
            setCharCount(value.length);
        }
    };

    const handleSubmit = () => {
        if (problem.trim().length > 0) {
            setScreen('selection');
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">
            {/* Animated background shapes */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl animate-float-delayed" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-500/3 blur-3xl animate-pulse-glow" />
            </div>

            {/* Content */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="relative z-10 w-full max-w-lg text-center"
            >
                {/* Logo text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="text-sm tracking-[0.3em] uppercase text-[var(--text-secondary)] mb-6 font-medium"
                >
                    İÇ MECLİS
                </motion.p>

                {/* Main heading */}
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                    className="text-5xl md:text-6xl font-bold mb-4 gradient-text"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                >
                    İç Meclisin
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.6 }}
                    className="text-lg text-[var(--text-secondary)] mb-10"
                >
                    Sorununu 16 farklı zihinle tartış.
                </motion.p>

                {/* Textarea Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.8 }}
                    className="glass rounded-2xl p-5"
                >
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)]">
                            ANALİZ GİRİŞİ
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                            {charCount} / 500
                        </span>
                    </div>

                    <textarea
                        value={problem}
                        onChange={handleChange}
                        placeholder="Ne üzerine danışmak istiyorsun?"
                        className="w-full min-h-[140px] bg-transparent border-none outline-none resize-none text-[var(--text-primary)] text-base placeholder:text-[var(--text-secondary)]/50 leading-relaxed"
                    />

                    <div className="flex items-center gap-2 mt-3 text-xs text-[var(--text-secondary)]/50">
                        <span>✦</span>
                        <span>Meclis üyeleri hazırda bekliyor...</span>
                    </div>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8, duration: 0.6 }}
                    onClick={handleSubmit}
                    disabled={problem.trim().length === 0}
                    className="mt-8 w-full py-4 rounded-xl text-white font-semibold text-base tracking-wide uppercase transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{
                        background: problem.trim().length > 0
                            ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                            : 'rgba(124, 58, 237, 0.2)',
                    }}
                    whileHover={problem.trim().length > 0 ? { scale: 1.02 } : {}}
                    whileTap={problem.trim().length > 0 ? { scale: 0.98 } : {}}
                >
                    KARAKTERLERİ SEÇ →
                </motion.button>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="mt-4 text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)]/40"
                >
                    ZİHİNSEL ARKETİP SEÇİMİ BİR SONRAKİ ADIMDA YAPILACAKTIR
                </motion.p>
            </motion.div>
        </div>
    );
}
