'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTERS } from '@/data/characters';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { trackEvent } from '@/lib/analytics';
import { MicButton } from '@/components/MicButton';
import type { AppScreen } from '@/app/page';

interface WelcomeScreenProps {
    onNavigate: (screen: AppScreen) => void;
}

const QUICK_TOPICS: Record<string, string[]> = {
    tr: ['İş değiştirmeli miyim?', 'İlişki kararı', 'Kariyer yönüm', 'Büyük bir karar'],
    en: ['Should I quit my job?', 'Relationship dilemma', 'Career direction', 'Big life decision'],
};

const PREVIEW_TYPES = ['ENTJ', 'INTJ', 'ENTP', 'INFJ'];

export default function WelcomeScreen({ onNavigate }: WelcomeScreenProps) {
    const { sessions, streak, switchToSession, createNewSession } = useSessionStore();
    const [problem, setProblem] = useState('');
    const [charCount, setCharCount] = useState(0);
    const lang = 'tr'; // web is TR-only for now

    // Incomplete sessions the user can continue
    const incompleteSessions = sessions.filter(s =>
        s.status !== 'report_ready' &&
        s.status !== 'idle' &&
        s.turns.length > 0
    );

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= 500) {
            setProblem(value);
            setCharCount(value.length);
        }
    };

    const handleSubmit = () => {
        if (problem.trim().length > 0) {
            trackEvent('session_started', {
                problem_length: problem.trim().length,
                word_count: problem.trim().split(/\s+/).length,
            });
            createNewSession(problem.trim(), []);
            onNavigate('selection');
        }
    };

    const handleContinueSession = (sessionId: string) => {
        switchToSession(sessionId);
        onNavigate('discussion');
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'awaiting_vote': return { text: 'Oy bekliyor', color: '#F59E0B' };
            case 'awaiting_input': return { text: 'Devam et', color: '#3B82F6' };
            case 'awaiting_deeper_or_report': return { text: 'Derinleş', color: '#10B981' };
            case 'round1_ready': return { text: 'Round 1', color: '#7C3AED' };
            case 'round2_ready': return { text: '1:1', color: '#10B981' };
            default: return { text: 'Devam et', color: '#7C3AED' };
        }
    };

    return (
        <div className="relative min-h-screen flex flex-col overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-purple-600/5 blur-3xl animate-float" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-teal-500/5 blur-3xl animate-float-delayed" />
            </div>

            <div className="relative z-10 w-full max-w-lg mx-auto flex flex-col flex-1">
                {/* SECTION 1: HEADER */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px 8px' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 20 }}>⚖️</span>
                        <div>
                            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '0.04em' }}>
                                <span style={{ color: '#5B4FD4' }}>16</span><span style={{ color: 'white' }}>TypeTalk</span>
                            </div>
                            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                MBTI AI Advisor
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {streak.currentStreak > 0 && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                                borderRadius: 20, padding: '3px 10px', fontSize: 11,
                            }}>
                                <span>⚡</span>
                                <span style={{ color: '#A78BFA', fontWeight: 500 }}>
                                    {streak.currentStreak} {lang === 'tr' ? 'gün' : 'day streak'}
                                </span>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* SECTION 2: HERO with FOMO TAG */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.6 }}
                    style={{ padding: '10px 16px 0', textAlign: 'center' }}
                >
                    {/* FOMO tag */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: 'rgba(107,92,231,0.15)',
                        border: '0.5px solid rgba(107,92,231,0.25)',
                        borderRadius: 20, padding: '3px 10px', marginBottom: 10,
                    }}>
                        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#6B5CE7' }} />
                        <span style={{ fontSize: 9, color: '#9B8FFF', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                            {lang === 'tr' ? '247 kişi bugün meclis kurdu' : '247 people built their council today'}
                        </span>
                    </div>

                    {/* Hero heading */}
                    <h1 style={{
                        fontSize: 28, fontWeight: 700, color: 'white',
                        letterSpacing: '-0.5px', lineHeight: 1.15, marginBottom: 5,
                        fontFamily: "'Playfair Display', serif",
                    }}>
                        {lang === 'tr'
                            ? <>Aklında<br />ne <span style={{ color: '#6B5CE7' }}>var?</span></>
                            : <>What&apos;s on<br />your <span style={{ color: '#6B5CE7' }}>mind?</span></>}
                    </h1>

                    {/* Subtitle */}
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 12, whiteSpace: 'pre-line' }}>
                        {lang === 'tr'
                            ? '16 MBTI zihni sorununu tartışıyor.\nHangi ses sana en çok benziyor?'
                            : '16 MBTI minds debate your problem.\nWhich voice sounds most like you?'}
                    </p>
                </motion.div>

                {/* SECTION 3: CHARACTER ROW */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25, duration: 0.5 }}
                    style={{ display: 'flex', gap: 6, overflowX: 'auto', padding: '0 16px', marginBottom: 12 }}
                    className="hide-scrollbar"
                >
                    {PREVIEW_TYPES.map(mbti => {
                        const vis = CHARACTER_VISUALS[mbti];
                        if (!vis) return null;
                        return (
                            <div key={mbti} style={{
                                background: 'rgba(255,255,255,0.03)',
                                border: '0.5px solid rgba(255,255,255,0.08)',
                                borderRadius: 10, padding: '7px 10px',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                                flexShrink: 0, minWidth: 56,
                            }}>
                                <span style={{ fontSize: 18 }}>{vis.emoji}</span>
                                <span style={{ fontSize: 9, fontWeight: 600, color: vis.accentColor }}>{mbti}</span>
                                <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)' }}>{vis.label}</span>
                            </div>
                        );
                    })}
                    {/* +12 more */}
                    <div style={{
                        background: 'rgba(107,92,231,0.1)', border: '0.5px solid rgba(107,92,231,0.2)',
                        borderRadius: 10, padding: '7px 10px', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 3, flexShrink: 0, minWidth: 46,
                    }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#9B8FFF' }}>+12</span>
                        <span style={{ fontSize: 8, color: 'rgba(155,143,255,0.6)' }}>{lang === 'tr' ? 'daha' : 'more'}</span>
                    </div>
                </motion.div>

                {/* SECTION 4: INPUT WITH VOICE BUTTON */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35, duration: 0.6 }}
                    style={{
                        margin: '0 16px 10px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.09)',
                        borderRadius: 14, padding: 12,
                    }}
                >
                    {/* Label row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)' }}>
                            {lang === 'tr' ? 'KONUNU PAYLAŞ' : 'SHARE YOUR TOPIC'}
                        </span>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{charCount} / 500</span>
                    </div>

                    {/* Textarea */}
                    <textarea
                        value={problem}
                        onChange={handleChange}
                        placeholder={lang === 'tr'
                            ? 'Kararını, sorununu veya kafanda dönen şeyi anlat...'
                            : 'Share your decision, dilemma, or what\'s going through your head...'}
                        style={{
                            width: '100%', minHeight: 60, background: 'transparent',
                            border: 'none', outline: 'none', resize: 'none',
                            fontSize: 12, color: 'rgba(255,255,255,0.75)',
                            fontStyle: problem ? 'normal' : 'italic',
                            lineHeight: 1.5, fontFamily: 'inherit',
                        }}
                        maxLength={500}
                        autoFocus
                    />

                    {/* Bottom actions row */}
                    <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        marginTop: 8, paddingTop: 8, borderTop: '0.5px solid rgba(255,255,255,0.06)',
                    }}>
                        <MicButton onResult={(text) => {
                            const merged = (problem + ' ' + text).trim();
                            if (merged.length <= 500) {
                                setProblem(merged);
                                setCharCount(merged.length);
                            }
                        }} lang={lang} />
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>
                            {lang === 'tr' ? 'veya yaz' : 'or type'}
                        </span>
                    </div>
                </motion.div>

                {/* SECTION 5: QUICK TOPIC CHIPS */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    style={{ padding: '0 16px 10px' }}
                >
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                        {lang === 'tr' ? 'Popüler konular' : 'Popular topics'}
                    </div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(QUICK_TOPICS[lang] || QUICK_TOPICS.tr).map(topic => (
                            <button
                                key={topic}
                                onClick={() => { setProblem(topic); setCharCount(topic.length); }}
                                style={{
                                    background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)',
                                    borderRadius: 20, padding: '4px 10px', fontSize: 9,
                                    color: 'rgba(255,255,255,0.5)', cursor: 'pointer',
                                }}
                            >
                                {topic}
                            </button>
                        ))}
                    </div>
                </motion.div>

                {/* SECTION 6: CTA BUTTON */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.45, duration: 0.5 }}
                    style={{ padding: '0 16px 6px' }}
                >
                    <button
                        onClick={handleSubmit}
                        disabled={problem.trim().length === 0}
                        style={{
                            width: '100%',
                            background: problem.trim().length > 0
                                ? 'linear-gradient(135deg, #6B5CE7, #5048C8)'
                                : 'rgba(107,92,231,0.2)',
                            borderRadius: 14, padding: 14, border: 'none',
                            fontSize: 14, fontWeight: 700, color: 'white', cursor: problem.trim().length > 0 ? 'pointer' : 'not-allowed',
                            letterSpacing: '0.03em',
                            boxShadow: problem.trim().length > 0 ? '0 8px 24px rgba(107,92,231,0.35)' : 'none',
                            opacity: problem.trim().length > 0 ? 1 : 0.35,
                            transition: 'all 0.3s ease',
                        }}
                    >
                        {lang === 'tr' ? 'Meclisi Kur →' : 'Build My Council →'}
                    </button>
                    <div style={{ textAlign: 'center', fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>
                        {lang === 'tr' ? 'Ücretsiz · Kayıt gerekmez' : 'Free · No signup required'}
                    </div>
                </motion.div>

                {/* "Devam et" cards for incomplete sessions */}
                {incompleteSessions.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.55, duration: 0.5 }}
                        style={{ padding: '6px 16px 10px' }}
                    >
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                            {lang === 'tr' ? 'Ya da devam et' : 'Or continue'}
                        </div>
                        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="hide-scrollbar">
                            {incompleteSessions.slice(0, 4).map(session => {
                                const statusInfo = getStatusLabel(session.status);
                                return (
                                    <button
                                        key={session.sessionId}
                                        onClick={() => handleContinueSession(session.sessionId)}
                                        style={{
                                            flexShrink: 0, textAlign: 'left', padding: '8px 12px',
                                            borderRadius: 12, minWidth: 140, maxWidth: 180,
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-subtle)',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>
                                            {session.topicPreview}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusInfo.color }} />
                                            <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.05em', color: statusInfo.color }}>
                                                {statusInfo.text}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* SECTION 7: SOCIAL PROOF BLOCK */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    style={{ padding: '0 16px 10px' }}
                >
                    <div style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '0.5px solid rgba(255,255,255,0.06)',
                        borderRadius: 14, padding: '10px 12px',
                    }}>
                        {/* Stats row */}
                        <div style={{ display: 'flex', marginBottom: 8, paddingBottom: 8, borderBottom: '0.5px solid rgba(255,255,255,0.06)' }}>
                            {[
                                { val: '24K+', label: lang === 'tr' ? 'Danışma' : 'Sessions' },
                                { val: '4.9★', label: lang === 'tr' ? 'Puan' : 'Rating' },
                                { val: '16', label: lang === 'tr' ? 'MBTI tipi' : 'MBTI types' },
                            ].map((stat, i, arr) => (
                                <div key={i} style={{ flex: 1, textAlign: 'center', borderRight: i < arr.length - 1 ? '0.5px solid rgba(255,255,255,0.08)' : 'none' }}>
                                    <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>{stat.val}</div>
                                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Live activity */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Stacked avatars */}
                            <div style={{ display: 'flex' }}>
                                {['#1A0F3A', '#041A1A', '#0F1F2A'].map((bg, i) => (
                                    <div key={i} style={{
                                        width: 20, height: 20, borderRadius: '50%',
                                        background: bg, border: '1.5px solid #09090C',
                                        marginRight: -6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                                    }}>
                                        {['⚡', '🌊', '🔭'][i]}
                                    </div>
                                ))}
                            </div>
                            <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)', flex: 1 }}>
                                {lang === 'tr' ? 'Birisi şu an meclis kuruyor' : 'Someone is building a council right now'}
                            </span>
                            {/* Live green dot */}
                            <div style={{
                                width: 7, height: 7, borderRadius: '50%', background: '#22C55E',
                                animation: 'pulse 2s ease-in-out infinite',
                            }} />
                        </div>
                    </div>
                </motion.div>

                {/* SECTION 8: TESTIMONIAL CARD */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    style={{ padding: '0 16px 12px' }}
                >
                    <div style={{
                        background: 'rgba(255,255,255,0.025)',
                        border: '0.5px solid rgba(255,255,255,0.06)',
                        borderRadius: 14, padding: '10px 12px',
                    }}>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: 8 }}>
                            {lang === 'tr'
                                ? '"ENTJ bana tam söylenmem gereken şeyi söyledi. Bir haftadır düşündüğüm şeyi 3 dakikada çözdüm."'
                                : '"ENTJ told me exactly what I needed to hear. Solved in 3 minutes what I\'d been overthinking for a week."'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1A0F3A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>⚡</div>
                            <div>
                                <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)' }}>
                                    {lang === 'tr' ? 'Kerem A. · İstanbul' : 'Alex M. · New York'}
                                </div>
                                <div style={{ fontSize: 8, color: '#9B8FFF' }}>ENTJ {lang === 'tr' ? 'seçti' : 'selected'}</div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
