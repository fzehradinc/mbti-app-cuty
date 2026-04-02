import { create } from 'zustand';
import { Screen, Turn, Report } from '@/types';

interface SessionHistory {
    id: string;
    problem: string;
    selectedCharacters: string[];
    createdAt: Date;
    status: 'active' | 'completed';
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

    // Discussion state
    turns: Turn[];
    addTurn: (turn: Turn) => void;

    // Report
    report: Report | null;
    setReport: (report: Report) => void;

    // Sessions History
    sessions: SessionHistory[];
    activeSessionId: string | null;

    // Reset
    startNewSession: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
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

    // Discussion
    turns: [],
    addTurn: (turn) => set({ turns: [...get().turns, turn] }),

    // Report
    report: null,
    setReport: (report) => set({ report }),

    // History
    sessions: [],
    activeSessionId: null,

    // Reset
    startNewSession: () => set({
        currentScreen: 'welcome',
        problem: '',
        selectedCharacters: [],
        turns: [],
        report: null,
        activeSessionId: null,
    }),
}));
