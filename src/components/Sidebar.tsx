'use client';

import { motion } from 'framer-motion';
import type { SessionData } from '@/store/sessionStore';

interface StreakData {
    currentStreak: number;
    lastSessionDate: string | null;
    totalSessions: number;
    insightsCollected: number;
}

interface SidebarProps {
    isOpen: boolean;
    onToggle: () => void;
    sessions: SessionData[];
    activeSessionId: string | null;
    onSelectSession: (sessionId: string) => void;
    onNewSession: () => void;
    streak: StreakData;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    idle: { label: 'Başlamadı', color: '#6B7280' },
    round1_loading: { label: 'Tartışma...', color: '#F59E0B' },
    awaiting_vote: { label: 'Oy bekliyor', color: '#F97316' },
    awaiting_input: { label: 'Yanıt bekliyor', color: '#3B82F6' },
    round2_loading: { label: 'Derinleşme...', color: '#10B981' },
    awaiting_deeper_or_report: { label: 'Devam/Rapor', color: '#8B5CF6' },
    report_loading: { label: 'Rapor...', color: '#EC4899' },
    report_ready: { label: 'Tamamlandı', color: '#10B981' },
};

export default function Sidebar({ isOpen, onToggle, sessions, activeSessionId, onSelectSession, onNewSession, streak }: SidebarProps) {
    // Milestone messages
    const getMilestoneText = (total: number): string | null => {
        if (total >= 10) return '16TypeTalk seninle büyüyor.';
        if (total >= 5) return '16TypeTalk seni tanıyor artık.';
        return null;
    };

    const milestoneText = getMilestoneText(streak.totalSessions);

    // Sort sessions: most recently updated first
    const sortedSessions = [...sessions].sort((a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

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
                        <span style={{ color: '#5B4FD4' }}>16</span>TypeTalk
                    </h1>
                    <button
                        onClick={onToggle}
                        className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    >
                        ✕
                    </button>
                </div>

                {/* Streak indicator */}
                {streak.currentStreak > 0 && (
                    <div className="px-4 mb-3">
                        <div className="rounded-lg p-3" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">
                                        {streak.currentStreak >= 30 ? '🔥' : streak.currentStreak >= 14 ? '🔥' : streak.currentStreak >= 7 ? '🔥' : streak.currentStreak >= 3 ? '✨' : '⚡'}
                                    </span>
                                    <span className="text-sm font-medium text-[var(--accent)]">
                                        {streak.currentStreak} gün seri
                                    </span>
                                </div>
                                <span className="text-[10px] text-[var(--text-secondary)]">
                                    {streak.totalSessions} danışma
                                </span>
                            </div>
                            {streak.insightsCollected > 0 && (
                                <p className="text-[10px] text-[var(--text-secondary)]/60">
                                    {streak.insightsCollected} danışma tamamlandı
                                </p>
                            )}
                            {milestoneText && (
                                <p className="text-[10px] text-[var(--accent)]/70 mt-1 italic">
                                    {milestoneText}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* New Topic */}
                <div className="px-4 mb-4">
                    <button
                        onClick={onNewSession}
                        className="w-full py-2.5 rounded-lg text-sm font-medium tracking-wider uppercase flex items-center justify-center gap-2 transition-all hover:bg-[var(--accent)]/20"
                        style={{
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
                            border: '1px solid rgba(124,58,237,0.3)',
                            color: 'var(--accent)',
                        }}
                    >
                        <span>+</span>
                        Yeni Konu
                    </button>
                </div>

                {/* Sessions List */}
                <div className="flex-1 overflow-y-auto px-3">
                    {sortedSessions.length === 0 ? (
                        <div className="px-2 py-8 text-center">
                            <p className="text-xs text-[var(--text-secondary)]/50 leading-relaxed">
                                Henüz danışma yok.
                                <br />
                                İlk konunu başlat.
                            </p>
                        </div>
                    ) : (
                        sortedSessions.map(session => {
                            const isActive = session.sessionId === activeSessionId;
                            const statusInfo = STATUS_LABELS[session.status] || STATUS_LABELS.idle;
                            return (
                                <button
                                    key={session.sessionId}
                                    onClick={() => onSelectSession(session.sessionId)}
                                    className="w-full text-left px-3 py-3 rounded-lg mb-1 transition-all hover:bg-white/5 group"
                                    style={{
                                        background: isActive ? 'rgba(124, 58, 237, 0.08)' : 'transparent',
                                        borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                                    }}
                                >
                                    <p className="text-sm text-[var(--text-primary)] truncate group-hover:text-white">
                                        {session.topicPreview || session.problem.substring(0, 40)}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{ background: statusInfo.color }}
                                        />
                                        <span className="text-[10px]" style={{ color: statusInfo.color }}>
                                            {statusInfo.label}
                                        </span>
                                        <span className="text-[10px] text-[var(--text-secondary)] ml-auto">
                                            {new Date(session.updatedAt).toLocaleDateString('tr-TR')}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                {/* Session progress visualization */}
                {streak.totalSessions > 0 && (
                    <div className="px-4 py-3 border-t border-[var(--border-subtle)]">
                        <div className="flex flex-wrap gap-1 justify-center mb-2">
                            {Array.from({ length: Math.min(streak.totalSessions, 20) }).map((_, i) => (
                                <div
                                    key={i}
                                    className="w-2 h-2 rounded-full"
                                    style={{
                                        background: `rgba(124, 58, 237, ${0.3 + (i / 20) * 0.7})`,
                                    }}
                                />
                            ))}
                            {streak.totalSessions > 20 && (
                                <span className="text-[10px] text-[var(--text-secondary)]/40">
                                    +{streak.totalSessions - 20}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-4 border-t border-[var(--border-subtle)]">
                    <p className="text-[10px] text-[var(--text-secondary)]/40 text-center">
                        16TypeTalk v2.0
                    </p>
                </div>
            </motion.aside>
        </>
    );
}
