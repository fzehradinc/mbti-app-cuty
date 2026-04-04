'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const QUICK_REPLIES = [
    'Haklısın, ama...',
    'Bunu hiç düşünmemiştim',
    'Pratik adım ne olur?',
    'Korkularım var bu konuda',
    'Daha spesifik ol lütfen',
];

interface UserInputBarProps {
    onSubmit: (message: string) => void;
    disabled?: boolean;
}

export default function UserInputBar({ onSubmit, disabled }: UserInputBarProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = () => {
        if (message.trim().length > 0 && !disabled) {
            onSubmit(message.trim());
            setMessage('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
        >
            <p className="text-xs tracking-[0.1em] uppercase text-[var(--text-secondary)] mb-3">
                MECLİSE KATIL
            </p>

            {/* Quick reply chips */}
            <div className="flex gap-2 flex-wrap mb-3">
                {QUICK_REPLIES.map(reply => (
                    <button
                        key={reply}
                        onClick={() => setMessage(reply)}
                        className="rounded-full text-xs transition-all hover:bg-white/10 hover:text-white/90"
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            padding: '6px 14px',
                            color: 'rgba(255,255,255,0.6)',
                            whiteSpace: 'nowrap' as const,
                        }}
                    >
                        {reply}
                    </button>
                ))}
            </div>

            <div className="glass rounded-xl p-4">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Görüşünü ve sorununu paylaş..."
                    className="w-full min-h-[80px] bg-transparent border-none outline-none resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]/50 leading-relaxed"
                    disabled={disabled}
                />
            </div>

            <motion.button
                onClick={handleSubmit}
                disabled={message.trim().length === 0 || disabled}
                className="mt-3 w-full py-3.5 rounded-xl text-white font-semibold text-sm tracking-wider uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                    background: message.trim().length > 0 && !disabled
                        ? 'linear-gradient(135deg, #7C3AED, #6D28D9)'
                        : 'rgba(124, 58, 237, 0.2)',
                }}
                whileHover={message.trim().length > 0 ? { scale: 1.01 } : {}}
                whileTap={message.trim().length > 0 ? { scale: 0.99 } : {}}
            >
                MECLİSE İLET →
            </motion.button>
        </motion.div>
    );
}
