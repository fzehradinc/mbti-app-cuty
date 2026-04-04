import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Screen, Report } from '@/types';
import { ConversationStatus, ConversationTurn, canTransition } from '@/types/conversation';

interface SessionHistory {
    id: string;
    problem: string;
    selectedCharacters: string[];
    createdAt: Date;
    status: 'active' | 'completed';
}

interface StreakData {
    currentStreak: number;
    lastSessionDate: string | null;
    totalSessions: number;
    insightsCollected: number;
}

interface AppStore {
    // Navigation
    currentScreen: Screen;
    setScreen: (screen: Screen) => void;

    // Session
    problem: string;
    setProblem: (p: string) => void;

    selectedCharacters: string[];
    toggleCharacter: (mbti: string) => void;
    clearCharacters: () => void;

    // Conversation State Machine
    conversationId: string | null;
    conversationStatus: ConversationStatus;
    activePersona: string | null;
    turns: ConversationTurn[];
    transitionTo: (status: ConversationStatus) => void;
    addTurn: (turn: ConversationTurn) => void;
    selectPersona: (mbti: string) => void;
    initConversation: () => void;

    // Report
    report: Report | null;
    setReport: (report: Report) => void;

    // Sessions History
    sessions: SessionHistory[];
    saveCurrentSession: () => void;

    // Streak System
    streak: StreakData;
    updateStreak: () => void;
    incrementInsights: () => void;

    // Reset
    startNewSession: () => void;
}

function getToday(): string {
    return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
}

function generateId(): string {
    return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

export const useAppStore = create<AppStore>()(
    persist(
        (set, get) => ({
            // Navigation
            currentScreen: 'welcome',
            setScreen: (screen) => set({ currentScreen: screen }),

            // Session
            problem: '',
            setProblem: (p) => set({ problem: p }),

            selectedCharacters: [],
            toggleCharacter: (mbti) => {
                const current = get().selectedCharacters;
                if (current.includes(mbti)) {
                    set({ selectedCharacters: current.filter(c => c !== mbti) });
                } else if (current.length < 5) {
                    set({ selectedCharacters: [...current, mbti] });
                }
            },
            clearCharacters: () => set({ selectedCharacters: [] }),

            // Conversation State Machine
            conversationId: null,
            conversationStatus: 'idle',
            activePersona: null,
            turns: [],

            initConversation: () => {
                set({
                    conversationId: generateId(),
                    conversationStatus: 'idle',
                    activePersona: null,
                    turns: [],
                    report: null,
                });
            },

            transitionTo: (status) => {
                const current = get().conversationStatus;
                if (canTransition(current, status)) {
                    set({ conversationStatus: status });
                } else {
                    console.warn(`Invalid transition: ${current} → ${status}`);
                }
            },

            addTurn: (turn) => set({ turns: [...get().turns, turn] }),

            selectPersona: (mbti) => {
                set({ activePersona: mbti });
            },

            // Report
            report: null,
            setReport: (report) => set({ report }),

            // History
            sessions: [],
            saveCurrentSession: () => {
                const { problem, selectedCharacters, sessions } = get();
                if (!problem.trim()) return;

                const newSession: SessionHistory = {
                    id: `session-${Date.now()}`,
                    problem,
                    selectedCharacters,
                    createdAt: new Date(),
                    status: 'completed',
                };

                set({
                    sessions: [newSession, ...sessions].slice(0, 50),
                });
            },

            // Streak
            streak: {
                currentStreak: 0,
                lastSessionDate: null,
                totalSessions: 0,
                insightsCollected: 0,
            },

            updateStreak: () => {
                const { streak } = get();
                const today = getToday();

                if (streak.lastSessionDate === today) return;

                const yesterday = getYesterday();
                let newStreak: number;

                if (streak.lastSessionDate === yesterday) {
                    newStreak = streak.currentStreak + 1;
                } else if (!streak.lastSessionDate) {
                    newStreak = 1;
                } else {
                    newStreak = 1;
                }

                set({
                    streak: {
                        ...streak,
                        currentStreak: newStreak,
                        lastSessionDate: today,
                        totalSessions: streak.totalSessions + 1,
                    },
                });
            },

            incrementInsights: () => {
                const { streak } = get();
                set({
                    streak: {
                        ...streak,
                        insightsCollected: streak.insightsCollected + 1,
                    },
                });
            },

            // Reset
            startNewSession: () => {
                const { problem } = get();
                if (problem.trim()) {
                    get().saveCurrentSession();
                }

                set({
                    currentScreen: 'welcome',
                    problem: '',
                    selectedCharacters: [],
                    conversationId: null,
                    conversationStatus: 'idle',
                    activePersona: null,
                    turns: [],
                    report: null,
                });
            },
        }),
        {
            name: 'inner-council-storage',
            partialize: (state) => ({
                sessions: state.sessions,
                streak: state.streak,
            }),
        }
    )
);
