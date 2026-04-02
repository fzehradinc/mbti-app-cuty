'use client';

import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
}

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
    const { startNewSession, sessions } = useAppStore();

    return (
        <>
            {/* Overlay (mobile) */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={onToggle}
                />
            )}

            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{
                    x: isOpen ? 0 : -260,
                }}
                className="fixed md:relative z-40 w-[260px] h-screen flex-shrink-0 flex flex-col"
                style={{
                    background: 'var(--bg-secondary)',
                    borderRight: '1px solid var(--border-subtle)',
                }}
            >
                {/* Logo */}
                <div className="px-5 py-5 flex items-center justify-between">
                    <h1
                        className="text-lg font-bold tracking-wider"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        Inner Council
                    </h1>
                    <button
                        onClick={onToggle}
                        className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        ✕
                    </button>
                </div>

                {/* New Topic */}
                <div className="px-4 mb-4">
                    <button
                        onClick={() => {
                            startNewSession();
                            onToggle();
                        }}
                        className="w-full py-2.5 rounded-lg text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:bg-[var(--accent)]/20"
                        style={{
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-secondary)',
                        }}
                    >
                        <span>+</span>
                        Yeni Konu
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-3">
                    {sessions.length === 0 ? (
                        <div className="px-2 py-8 text-center">
                            <p className="text-xs text-[var(--text-secondary)]/50 leading-relaxed">
                                Henüz danışma yok.
                                <br />
                                İlk konunu başlat.
                            </p>
                        </div>
                    ) : (
                        sessions.map(session => (
                            <button
                                key={session.id}
                                className="w-full text-left px-3 py-3 rounded-lg mb-1 transition-all hover:bg-white/5 group"
                            >
                                <p className="text-sm text-[var(--text-primary)] truncate group-hover:text-white">
                                    {session.problem.substring(0, 40)}...
                                </p>
                                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                                    {new Date(session.createdAt).toLocaleDateString('tr-TR')}
                                </p>
                            </button>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
                    <p className="text-[10px] text-[var(--text-secondary)]/40 text-center">
                        İç Meclis v1.0
                    </p>
                </div>
            </motion.aside>
        </>
    );
}
