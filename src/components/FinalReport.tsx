'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTERS } from '@/data/characters';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import ShareCard, { useShareCard } from './ShareCard';
import { trackEvent } from '@/lib/analytics';
import type { AppScreen } from '@/app/page';

interface FinalReportProps {
    onNavigate: (screen: AppScreen) => void;
}

export default function FinalReport({ onNavigate }: FinalReportProps) {
    const activeSession = useSessionStore(state => {
        const id = state.activeSessionId;
        if (!id) return null;
        return state.sessions.find(s => s.sessionId === id) ?? null;
    });
    const streak = useSessionStore(state => state.streak);
    const clearActiveSession = useSessionStore(state => state.clearActiveSession);

    const [headerRevealed, setHeaderRevealed] = useState(false);
    const [displayedTitle, setDisplayedTitle] = useState('');
    const shareCardRef = useRef<HTMLDivElement>(null);
    const { share } = useShareCard();

    const headerText = 'Meclisin Kararı';

    // Typewriter reveal for header
    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i <= headerText.length) {
                setDisplayedTitle(headerText.slice(0, i));
                i++;
            } else {
                clearInterval(interval);
                setHeaderRevealed(true);
            }
        }, 60);
        return () => clearInterval(interval);
    }, []);

    // Track report viewed
    useEffect(() => {
        if (activeSession) {
            trackEvent('report_viewed', {
                total_rounds: activeSession.turns.length,
                session_id: activeSession.sessionId,
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!activeSession || !activeSession.report) return null;

    const report = activeSession.report;
    const selectedCharacters = activeSession.selectedCharacters;
    const turns = activeSession.turns;

    // Determine dominant vote
    const voteCounts: Record<string, number> = {};
    turns.forEach(t => {
        if (t.userVote) voteCounts[t.userVote] = (voteCounts[t.userVote] || 0) + 1;
    });
    const dominantVote = Object.entries(voteCounts).sort(([, a], [, b]) => b - a)[0];
    const dominantMbti = dominantVote?.[0] || selectedCharacters[0];
    const dominantChar = CHARACTERS.find(c => c.mbti === dominantMbti);

    const reportId = `#16TT-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const handleNewSession = () => {
        clearActiveSession();
        onNavigate('welcome');
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Top bar */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <div className="flex items-center gap-3">
                    <span className="text-lg">☰</span>
                    <span className="text-sm tracking-[0.2em] uppercase font-medium"><span style={{ color: '#5B4FD4' }}>16</span>TypeTalk</span>
                </div>
                <div className="flex items-center gap-3">
                    {streak.currentStreak > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-[var(--accent)]">
                            <span>{streak.currentStreak >= 7 ? '🔥' : '⚡'}</span>
                            <span>{streak.currentStreak}</span>
                        </div>
                    )}
                    <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold">
                        {dominantMbti?.[0] || 'U'}
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
                {/* Header — Typewriter reveal */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <h1
                        className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] mb-2"
                        style={{ fontFamily: "'Playfair Display', serif" }}
                    >
                        {displayedTitle}
                        <span style={{
                            display: 'inline-block',
                            width: 2,
                            height: '0.8em',
                            background: '#534AB7',
                            marginLeft: 3,
                            animation: headerRevealed ? 'none' : 'blink 0.7s infinite',
                            verticalAlign: 'middle',
                        }} />
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)]">
                        {turns.length} turda elde edilen içgörüler
                    </p>
                </motion.div>

                {/* Section 1: Core Tension — the fundamental conflict identified */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-3 font-medium">
                        TEMEL GERİLİM
                    </p>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed">
                        {report.coreTension}
                    </p>
                </motion.div>

                {/* Section 2: Where each voice landed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4 font-medium">
                        HER SESİN VARDIĞI NOKTA
                    </p>
                    <div className="space-y-4">
                        {Object.entries(report.characterPositions).map(([mbti, position], i) => {
                            const char = CHARACTERS.find(c => c.mbti === mbti);
                            return (
                                <motion.div
                                    key={mbti}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.5 + i * 0.1 }}
                                    className="flex gap-3"
                                >
                                    <div
                                        className="w-1 rounded-full flex-shrink-0"
                                        style={{ background: char?.color || '#7C3AED' }}
                                    />
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <div
                                                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold"
                                                style={{ background: `${char?.color}20`, color: char?.color }}
                                            >
                                                {mbti[0]}
                                            </div>
                                            <p className="text-xs font-bold tracking-wider" style={{ color: char?.color }}>
                                                {char?.name || mbti}
                                            </p>
                                        </div>
                                        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                                            {position}
                                        </p>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Section 3: Three paths forward */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="rounded-xl p-5 mb-4"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border-subtle)' }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--text-secondary)] mb-4 font-medium">
                        ÜÇ YOL
                    </p>
                    <div className="space-y-4">
                        {report.actionPaths.map((path, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.7 + i * 0.1 }}
                                className="flex gap-3 items-start"
                            >
                                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold bg-[var(--accent)]/20 text-[var(--accent)]">
                                    {i + 1}
                                </div>
                                <p className="text-sm text-[var(--text-primary)] leading-relaxed">
                                    {path}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Section 4: What your choices reveal — THE MOST POWERFUL SECTION */}
                {report.userInsight && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                        className="rounded-xl p-5 mb-4 relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(109,40,217,0.05))',
                            border: '1px solid rgba(124,58,237,0.25)',
                        }}
                    >
                        {/* Subtle glow effect */}
                        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[var(--accent)]/10 blur-3xl" />

                        <p className="text-xs tracking-[0.15em] uppercase text-[var(--accent)] mb-3 font-medium relative z-10">
                            SEÇİMLERİN NE SÖYLÜYOR
                        </p>
                        <p className="text-sm text-[var(--text-primary)] leading-relaxed relative z-10">
                            {report.userInsight}
                        </p>

                        {/* Dominant voice indicator */}
                        {dominantChar && (
                            <div className="mt-4 pt-4 border-t border-[var(--accent)]/15 flex items-center gap-3 relative z-10">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                                    style={{ background: CHARACTER_VISUALS[dominantMbti]?.bg || `${dominantChar.color}20` }}
                                >
                                    {CHARACTER_VISUALS[dominantMbti]?.emoji || dominantMbti?.substring(0, 2)}
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--text-secondary)]">
                                        En çok uyum hissettiğin ses
                                    </p>
                                    <p className="text-sm font-medium" style={{ color: dominantChar.color }}>
                                        {dominantChar.name} ({dominantMbti})
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Section 5: One thing to do this week */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                    className="rounded-xl p-5 mb-8"
                    style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(124,58,237,0.05))',
                        border: '1px solid rgba(124,58,237,0.2)',
                    }}
                >
                    <p className="text-xs tracking-[0.15em] uppercase text-[var(--accent)] mb-3 font-medium">
                        BU HAFTA YAP
                    </p>
                    <p className="text-base text-[var(--text-primary)] leading-relaxed font-medium">
                        {report.nextStep}
                    </p>
                </motion.div>

                {/* Action buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.3 }}
                    className="space-y-3"
                >
                    {/* Share button */}
                    <button
                        onClick={() => {
                            trackEvent('report_shared', {
                                voted_persona: dominantMbti,
                                character_count: selectedCharacters.length,
                            });
                            if (shareCardRef.current) share(shareCardRef.current);
                        }}
                        className="w-full py-4 rounded-xl text-white font-semibold text-sm tracking-wider uppercase flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}
                    >
                        BU RAPORU PAYLAŞ →
                    </button>

                    {/* New Session */}
                    <button
                        onClick={handleNewSession}
                        className="w-full py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:bg-white/5 transition-all tracking-wider uppercase"
                    >
                        Yeni Konu Başlat →
                    </button>
                </motion.div>

                {/* Archive ID */}
                <p className="text-center text-[10px] text-[var(--text-secondary)]/30 mt-6 tracking-wider">
                    ARŞİV NO: {reportId}
                </p>

                {/* Hidden ShareCard for PNG generation */}
                <ShareCard
                    ref={shareCardRef}
                    problem={activeSession.problem}
                    characters={selectedCharacters}
                    votedPersona={dominantMbti}
                    topInsight={report.userInsight || ''}
                    reportId={reportId}
                />
            </div>

            {/* Bottom nav (mobile) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-3 px-4 text-xs text-[var(--text-secondary)]" style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-subtle)' }}>
                <button className="flex flex-col items-center gap-1" onClick={handleNewSession}>
                    <span>⚡</span>
                    <span>MECLİS</span>
                </button>
                <button className="flex flex-col items-center gap-1" onClick={handleNewSession}>
                    <span>✦</span>
                    <span>YENİ KONU</span>
                </button>
                <button className="flex flex-col items-center gap-1">
                    <span>📂</span>
                    <span>ARŞİV</span>
                </button>
                <button className="flex flex-col items-center gap-1 text-[var(--accent)]">
                    <span>📋</span>
                    <span>RAPORLAR</span>
                </button>
            </div>
        </div>
    );
}
