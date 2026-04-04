'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useSessionStore } from '@/store/sessionStore';
import { useConversation } from '@/hooks/useConversation';
import { CHARACTERS } from '@/data/characters';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { trackEvent } from '@/lib/analytics';
import CharacterMessage from './CharacterMessage';
import VoteSelector from './VoteSelector';
import ContinuationSelector from './ContinuationSelector';
import UserInputBar from './UserInputBar';
import ProblemCard from './ProblemCard';
import Sidebar from './Sidebar';
import type { AppScreen } from '@/app/page';

interface DiscussionBoardProps {
    onNavigate: (screen: AppScreen) => void;
}

export default function DiscussionBoard({ onNavigate }: DiscussionBoardProps) {
    const {
        sessions,
        activeSessionId,
        setActivePersona,
        setContinuationPersonas,
        setSessionStatus,
        setSessionReport,
        switchToSession,
        clearActiveSession,
        updateStreak,
        incrementInsights,
        streak,
    } = useSessionStore();

    const activeSession = useSessionStore(state => {
        const id = state.activeSessionId;
        if (!id) return null;
        return state.sessions.find(s => s.sessionId === id) ?? null;
    });

    const { triggerRound1, triggerRound2, generateReport, isLoading } = useConversation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const hasInitialized = useRef<string | null>(null);

    // Derived from active session — useMemo to avoid re-creating arrays on every render
    const problem = activeSession?.problem ?? '';
    const selectedCharacters = useMemo(() => activeSession?.selectedCharacters ?? [], [activeSession?.selectedCharacters]);
    const turns = useMemo(() => activeSession?.turns ?? [], [activeSession?.turns]);
    const conversationStatus = activeSession?.status ?? 'idle';
    const activePersona = activeSession?.activePersona ?? null;

    // Auto-scroll on new content
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [turns, conversationStatus]);

    // Set browser tab title
    useEffect(() => {
        if (activeSession) {
            document.title = `16TypeTalk — ${activeSession.problem.slice(0, 30)}...`;
        }
        return () => { document.title = '16TypeTalk'; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.sessionId]);

    // Initialize: trigger Round 1 — ONCE per session
    useEffect(() => {
        if (!activeSession) {
            onNavigate('welcome');
            return;
        }

        // Only trigger Round 1 if this is a new session we haven't initialized yet
        if (hasInitialized.current === activeSession.sessionId) return;
        if (activeSession.turns.length > 0) {
            // Session already has turns (switching back to it), just mark initialized
            hasInitialized.current = activeSession.sessionId;
            return;
        }

        hasInitialized.current = activeSession.sessionId;
        updateStreak();

        if (activeSession.status === 'idle') {
            setTimeout(() => {
                triggerRound1().catch(console.error);
            }, 50);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeSession?.sessionId]);

    const handleVote = useCallback((mbti: string) => {
        setActivePersona(mbti);
        incrementInsights();
        trackEvent('persona_voted', { voted_for: mbti, session_id: activeSessionId });
        setSessionStatus('awaiting_continuation_select');
    }, [setActivePersona, incrementInsights, setSessionStatus]);

    const handleContinuationConfirm = useCallback((selected: string[]) => {
        setContinuationPersonas(selected);
        trackEvent('continuation_selected', {
            continuation_count: selected.length,
            voted_persona: activePersona,
        });
        setSessionStatus('awaiting_input');
    }, [setContinuationPersonas, setSessionStatus, activePersona]);

    const handleUserSubmit = useCallback(async (message: string) => {
        await triggerRound2(message);
    }, [triggerRound2]);

    const handleGoDeeper = useCallback(() => {
        setSessionStatus('awaiting_input');
    }, [setSessionStatus]);

    const handleGenerateReport = useCallback(async () => {
        setIsGeneratingReport(true);
        try {
            const report = await generateReport();
            setSessionReport(report);
            onNavigate('report');
        } catch (error) {
            console.error('Failed to generate report:', error);
            setSessionReport({
                coreTension: 'Temel çatışma analiz edildi.',
                characterPositions: Object.fromEntries(
                    selectedCharacters.map(mbti => [mbti, 'Değerlendirme yapıldı.'])
                ),
                actionPaths: [
                    'Şeffaf iletişim kanallarını 48 saat içinde açın.',
                    'Değer analizi için bağımsız bir rapor hazırlayın.',
                    'Alternatif yolları araştırmaya başlayın.',
                ],
                userInsight: 'Oylama düzeniniz önemli bir profil ortaya koyuyor.',
                nextStep: 'Sınırlarını belirlemek için bir görüşme yap.',
                generatedAt: new Date(),
            });
            onNavigate('report');
        } finally {
            setIsGeneratingReport(false);
        }
    }, [generateReport, setSessionReport, onNavigate, selectedCharacters]);

    // Session switching handler
    const handleSelectSession = useCallback((sessionId: string) => {
        switchToSession(sessionId);
        setSidebarOpen(false);
        const session = sessions.find(s => s.sessionId === sessionId);
        if (session && session.status === 'report_ready') {
            onNavigate('report');
        }
        // DiscussionBoard re-renders with new session data automatically
    }, [switchToSession, sessions, onNavigate]);

    const handleNewSession = useCallback(() => {
        setSidebarOpen(false);
        trackEvent('new_topic_started', {
            is_returning: sessions.length > 1,
            previous_sessions: sessions.length,
        });
        clearActiveSession();
        onNavigate('welcome');
    }, [onNavigate, clearActiveSession, sessions.length]);

    // Split turns for display
    const round1Turns = turns.filter(t => t.roundType === 'round1');
    const round2Turns = turns.filter(t => t.roundType === 'round2');

    const showVoteSelector = conversationStatus === 'awaiting_vote';
    const showContinuationSelector = conversationStatus === 'awaiting_continuation_select';
    const showUserInput = conversationStatus === 'awaiting_input';
    const showDeeperOrReport = conversationStatus === 'awaiting_deeper_or_report';
    const showLoading = conversationStatus === 'round1_loading' || conversationStatus === 'round2_loading';
    const loadingCharacters = conversationStatus === 'round2_loading'
        ? (activeSession?.continuationPersonas?.length ? activeSession.continuationPersonas : (activePersona ? [activePersona] : selectedCharacters))
        : selectedCharacters;

    if (!activeSession) return null;

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                sessions={sessions}
                activeSessionId={activeSessionId}
                onSelectSession={handleSelectSession}
                onNewSession={handleNewSession}
                streak={streak}
            />

            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg"
                        >
                            ☰
                        </button>
                        <span className="text-sm tracking-[0.2em] uppercase font-medium">
                            <span style={{ color: '#5B4FD4' }}>16</span>TypeTalk
                        </span>
                        {activePersona && (
                            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(124, 58, 237, 0.15)', color: 'var(--accent)' }}>
                                1:1 {activePersona}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {activePersona && (
                            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
                                style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                <span>{CHARACTER_VISUALS[activePersona]?.emoji || '💬'}</span>
                                <span style={{ color: 'var(--accent)' }}>{activePersona}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Scrollable content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 pb-32">
                    <div className="max-w-2xl mx-auto">
                        <ProblemCard problem={problem} characters={selectedCharacters} />

                        {/* Round 1 responses */}
                        {round1Turns.map((turn, turnIdx) => (
                            <div key={`r1-${turnIdx}`} className="mb-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-3 mb-4"
                                >
                                    <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                                        style={{ background: 'rgba(124, 58, 237, 0.2)', color: 'var(--accent)', border: '1px solid rgba(124, 58, 237, 0.4)' }}>
                                        Tartışma
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                                </motion.div>

                                {Object.entries(turn.responses).map(([mbti, resp], i) => (
                                    <CharacterMessage
                                        key={`r1-${turnIdx}-${mbti}`}
                                        mbti={mbti}
                                        message={resp.message}
                                        quote={resp.quote}
                                        index={i}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Vote indicator */}
                        {activePersona && round1Turns.length > 0 && !showVoteSelector && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mb-6 ml-auto max-w-[85%]"
                            >
                                <div className="rounded-xl p-4" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                    <p className="text-xs text-[var(--accent)] uppercase tracking-wider mb-1 font-medium">
                                        SEÇİMİN
                                    </p>
                                    <p className="text-sm text-[var(--text-primary)]">
                                        <span className="font-medium">{activePersona}</span> ile derinleşmeyi seçtin
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Round 2 responses */}
                        {round2Turns.map((turn, turnIdx) => (
                            <div key={`r2-${turnIdx}`} className="mb-8">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex items-center gap-3 mb-4"
                                >
                                    <div className="px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                                        style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                        1:1 Derinleşme — {turn.continuationPersonas?.length > 1 ? turn.continuationPersonas.join(', ') : turn.selectedPersona}
                                    </div>
                                    <div className="flex-1 h-px" style={{ background: 'var(--border-subtle)' }} />
                                </motion.div>

                                {turn.userMessage && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-4 ml-auto max-w-[85%]"
                                    >
                                        <div className="rounded-xl p-4" style={{ background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.15)' }}>
                                            <p className="text-sm text-[var(--text-primary)]">{turn.userMessage}</p>
                                        </div>
                                    </motion.div>
                                )}

                                {Object.entries(turn.responses).map(([mbti, resp], i) => (
                                    <CharacterMessage
                                        key={`r2-${turnIdx}-${mbti}`}
                                        mbti={mbti}
                                        message={resp.message}
                                        quote={resp.quote}
                                        index={i}
                                    />
                                ))}
                            </div>
                        ))}

                        {/* Loading state */}
                        {showLoading && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center py-8"
                            >
                                <div className="flex gap-2 mb-4">
                                    {loadingCharacters.map((mbti) => {
                                        const vis = CHARACTER_VISUALS[mbti];
                                        return (
                                            <motion.div
                                                key={mbti}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-base"
                                                style={{ background: vis?.bg || 'rgba(124,58,237,0.1)' }}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: loadingCharacters.indexOf(mbti) * 0.2 }}
                                            >
                                                {vis?.emoji || mbti.substring(0, 2)}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)]">
                                    {conversationStatus === 'round2_loading'
                                        ? (loadingCharacters.length > 1 ? 'Karakterler düşünüyor...' : `${activePersona} düşünüyor...`)
                                        : 'Karakterler düşünüyor...'}
                                </p>
                            </motion.div>
                        )}

                        {/* Vote selector */}
                        {showVoteSelector && (
                            <VoteSelector
                                characters={selectedCharacters}
                                onVote={handleVote}
                                selectedVote={null}
                            />
                        )}

                        {/* Continuation selector (pick who responds in Round 2) */}
                        {showContinuationSelector && activePersona && (
                            <ContinuationSelector
                                allCharacters={selectedCharacters}
                                votedPersona={activePersona}
                                onConfirm={handleContinuationConfirm}
                            />
                        )}

                        {/* User input */}
                        {showUserInput && (
                            <UserInputBar onSubmit={handleUserSubmit} disabled={isLoading} />
                        )}

                        {/* Go Deeper or See Report */}
                        {showDeeperOrReport && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-6 mb-8 flex flex-col items-center gap-3"
                            >
                                <motion.button
                                    onClick={handleGoDeeper}
                                    className="w-full max-w-sm px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
                                    style={{
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: '#10B981',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                    }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    DERİNLEŞMEYE DEVAM ET →
                                </motion.button>

                                <motion.button
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className="w-full max-w-sm px-6 py-3.5 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all"
                                    style={{
                                        background: isGeneratingReport
                                            ? 'rgba(124, 58, 237, 0.2)'
                                            : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                                        color: 'white',
                                    }}
                                    whileHover={!isGeneratingReport ? { scale: 1.02 } : {}}
                                    whileTap={!isGeneratingReport ? { scale: 0.98 } : {}}
                                >
                                    {isGeneratingReport ? 'Karar hazırlanıyor...' : 'KARARI GÖR →'}
                                </motion.button>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom nav (mobile) */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around py-3 px-4 text-xs text-[var(--text-secondary)]" style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)', borderTop: '1px solid var(--border-subtle)' }}>
                    <button className="flex flex-col items-center gap-1 text-[var(--accent)]">
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
                </div>
            </div>
        </div>
    );
}
