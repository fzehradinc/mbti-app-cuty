'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface NewTopicDialogProps {
    isOpen: boolean;
    currentTopic: string;
    onContinue: () => void;
    onNewTopic: () => void;
}

export default function NewTopicDialog({ isOpen, currentTopic, onContinue, onNewTopic }: NewTopicDialogProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center px-4"
                    style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        className="w-full max-w-sm rounded-2xl p-6"
                        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                    >
                        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                            Devam eden konun var
                        </h3>
                        <p className="text-sm text-[var(--text-secondary)] mb-1">
                            Şu an açık konu:
                        </p>
                        <p className="text-sm text-[var(--accent)] mb-5 italic truncate">
                            &ldquo;{currentTopic}&rdquo;
                        </p>

                        <div className="space-y-2">
                            <button
                                onClick={onContinue}
                                className="w-full py-3 rounded-xl text-sm font-semibold tracking-wider uppercase"
                                style={{
                                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                    color: 'white',
                                }}
                            >
                                Devam Et
                            </button>
                            <button
                                onClick={onNewTopic}
                                className="w-full py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-white/5 transition-all tracking-wider uppercase"
                            >
                                Yeni Konu Başlat
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
