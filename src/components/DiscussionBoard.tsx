'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { useConversation } from '@/hooks/useConversation';
import { MOCK_RESPONSES, CHARACTERS } from '@/data/characters';
import CharacterMessage from './CharacterMessage';
import VoteSelector from './VoteSelector';
import UserInputBar from './UserInputBar';
import ProblemCard from './ProblemCard';
import Sidebar from './Sidebar';

export default function DiscussionBoard() {
    const { problem, selectedCharacters, turns: storeTurns, addTurn, setScreen, setReport } = useAppStore();
    const { submitTurn, generateReport, isLoading } = useConversation();

    const [currentResponses, setCurrentResponses] = useState<Record<string, { message: string; quote: string }> | null>(null);
    const [responsesLoaded, setResponsesLoaded] = useState(false);
    const [userVote, setUserVote] = useState<string | null>(null);
    const [userHasVoted, setUserHasVoted] = useState(false);
    const [turnCount, setTurnCount] = useState(0);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new content
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [storeTurns, currentResponses, responsesLoaded, userHasVoted]);

    // Load first turn responses on mount
    useEffect(() => {
        loadResponses(null, '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadResponses = async (vote: string | null, message: string) => {
        setResponsesLoaded(false);
        setCurrentResponses(null);
        setUserVote(null);
        setUserHasVoted(false);

        try {
            const result = await submitTurn({
                problem,
                characters: selectedCharacters,
                userVote: vote,
                userMessage: message,
            });

            if (result) {
                setCurrentResponses(result.responses);
                addTurn(result);
                setTurnCount(prev => prev + 1);
                setResponsesLoaded(true);
            }
        } catch (error) {
            console.error('Failed to get AI responses, falling back to mock data:', error);
            // Fallback to mock data if API fails
            const mockResponses: Record<string, { message: string; quote: string }> = {};
            selectedCharacters.forEach(mbti => {
                if (MOCK_RESPONSES[mbti]) {
                    mockResponses[mbti] = MOCK_RESPONSES[mbti];
                } else {
                    mockResponses[mbti] = {
                        message: `${mbti} olarak, bu konuda düşüncelerimi paylaşmak isterim. Durumunuzu dikkatle değerlendirdim.`,
                        quote: '"Her adım, doğru yöne atıldığında anlamlıdır." — Anonim',
                    };
                }
            });

            const fallbackTurn = {
                turnNumber: turnCount + 1,
                userVote: vote,
                userMessage: message,
                responses: mockResponses,
                createdAt: new Date(),
            };
            setCurrentResponses(mockResponses);
            addTurn(fallbackTurn);
            setTurnCount(prev => prev + 1);
            setResponsesLoaded(true);
        }
    };

    const handleVote = (mbti: string) => {
        setUserVote(mbti);
        setUserHasVoted(true);
    };

    const handleUserSubmit = async (message: string) => {
        // Start next turn
        await loadResponses(userVote, message);
    };

    const handleGenerateReport = async () => {
        setIsGeneratingReport(true);
        try {
            const report = await generateReport(problem, selectedCharacters);
            setReport(report);
            setScreen('report');
        } catch (error) {
            console.error('Failed to generate report:', error);
            // Fallback mock report
            setReport({
                coreTension: 'Kariyer büyümesi ile kişisel değerlerin korunması arasındaki denge, mevcut projenin etik sınırlarını zorluyor.',
                characterPositions: Object.fromEntries(
                    selectedCharacters.map(mbti => [
                        mbti,
                        CHARACTERS.find(c => c.mbti === mbti)?.name + ' perspektifinden değerlendirme yapıldı.',
                    ])
                ),
                actionPaths: [
                    'Şeffaf iletişim kanallarını 48 saat içinde açın.',
                    'Değer analizi için bağımsız bir rapor hazırlayın.',
                    'Alternatif kariyer yollarını araştırmaya başlayın.',
                ],
                userInsight: 'Oylama düzeniniz, pratik çözümler arayan ama duygusal derinliği de önemseyen bir profil ortaya koyuyor.',
                nextStep: 'Sınırlarını belirlemek için bir görüşme yap.',
                generatedAt: new Date(),
            });
            setScreen('report');
        } finally {
            setIsGeneratingReport(false);
        }
    };

    return (
        <div className="flex min-h-screen" style={{ background: 'var(--bg-primary)' }}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-screen">
                {/* Top bar */}
                <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between" style={{ background: 'rgba(13, 13, 15, 0.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-lg"
                        >
                            ☰
                        </button>
                        <span className="text-sm tracking-[0.2em] uppercase font-medium">
                            İÇ MECLİS
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {selectedCharacters.map(mbti => {
                            const char = CHARACTERS.find(c => c.mbti === mbti);
                            return (
                                <div
                                    key={mbti}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: char?.color || '#7C3AED' }}
                                >
                                    {mbti[0]}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Scrollable content */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 pb-32">
                    <div className="max-w-2xl mx-auto">
                        {/* Problem card */}
                        <ProblemCard problem={problem} characters={selectedCharacters} />

                        {/* Past turns */}
                        {storeTurns.slice(0, -1).map((turn, turnIdx) => (
                            <div key={turnIdx} className="mb-8">
                                {/* Turn responses */}
                                {Object.entries(turn.responses).map(([mbti, resp], i) => (
                                    <CharacterMessage
                                        key={`${turnIdx}-${mbti}`}
                                        mbti={mbti}
                                        message={resp.message}
                                        quote={resp.quote}
                                        index={i}
                                    />
                                ))}

                                {/* User's vote & message for this turn */}
                                {(turn.userVote || turn.userMessage) && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="mb-6 ml-auto max-w-[85%]"
                                    >
                                        <div className="rounded-xl p-4" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
                                            <p className="text-xs text-[var(--accent)] uppercase tracking-wider mb-2 font-medium">
                                                SENİN GÖRÜŞÜN
                                            </p>
                                            {turn.userVote && (
                                                <p className="text-xs text-[var(--text-secondary)] mb-2">
                                                    En yakın: <span className="text-[var(--text-primary)] font-medium">{turn.userVote}</span>
                                                </p>
                                            )}
                                            {turn.userMessage && (
                                                <p className="text-sm text-[var(--text-primary)]">{turn.userMessage}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        ))}

                        {/* Current turn responses */}
                        {currentResponses && (
                            <div className="mb-6">
                                {Object.entries(currentResponses).map(([mbti, resp], i) => (
                                    <CharacterMessage
                                        key={`current-${mbti}`}
                                        mbti={mbti}
                                        message={resp.message}
                                        quote={resp.quote}
                                        index={i}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Loading state */}
                        {isLoading && !currentResponses && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center py-8"
                            >
                                <div className="flex gap-2 mb-4">
                                    {selectedCharacters.map((mbti) => {
                                        const char = CHARACTERS.find(c => c.mbti === mbti);
                                        return (
                                            <motion.div
                                                key={mbti}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold"
                                                style={{ background: `${char?.color}20`, color: char?.color }}
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 1.5, repeat: Infinity, delay: selectedCharacters.indexOf(mbti) * 0.2 }}
                                            >
                                                {mbti.substring(0, 2)}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                                <p className="text-sm text-[var(--text-secondary)]">Karakterler düşünüyor...</p>
                            </motion.div>
                        )}

                        {/* Vote selector — ONLY after responses loaded */}
                        {responsesLoaded && !userHasVoted && (
                            <VoteSelector
                                characters={selectedCharacters}
                                onVote={handleVote}
                                selectedVote={userVote}
                            />
                        )}

                        {/* User input — ONLY after voting */}
                        {userHasVoted && (
                            <UserInputBar onSubmit={handleUserSubmit} disabled={isLoading} />
                        )}

                        {/* Show "Sonuca Geç" after 3+ turns */}
                        {turnCount >= 3 && responsesLoaded && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 mb-8 text-center"
                            >
                                <button
                                    onClick={handleGenerateReport}
                                    disabled={isGeneratingReport}
                                    className="px-8 py-3 rounded-xl text-sm font-semibold tracking-wider uppercase transition-all border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/10"
                                >
                                    {isGeneratingReport ? 'Rapor hazırlanıyor...' : 'SONUCA GEÇ →'}
                                </button>
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
                    <button className="flex flex-col items-center gap-1" onClick={() => useAppStore.getState().startNewSession()}>
                        <span>✦</span>
                        <span>YENİ KONU</span>
                    </button>
                    <button className="flex flex-col items-center gap-1">
                        <span>📂</span>
                        <span>ARŞİV</span>
                    </button>
                    <button className="flex flex-col items-center gap-1" onClick={turnCount >= 3 ? handleGenerateReport : undefined}>
                        <span>📋</span>
                        <span>RAPORLAR</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
