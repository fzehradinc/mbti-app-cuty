import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConversationStatus, ConversationTurn } from '@/types/conversation';
import { Report } from '@/types';

export interface SessionData {
  sessionId: string;
  problem: string;
  topicPreview: string;
  selectedCharacters: string[];
  activePersona: string | null;
  continuationPersonas: string[];
  status: ConversationStatus;
  turns: ConversationTurn[];
  report: Report | null;
  createdAt: string;
  updatedAt: string;
}

interface StreakData {
  currentStreak: number;
  lastSessionDate: string | null;
  totalSessions: number;
  insightsCollected: number;
}

interface SessionStore {
  sessions: SessionData[];
  activeSessionId: string | null;
  streak: StreakData;

  getActiveSession: () => SessionData | null;
  createNewSession: (problem: string, characters: string[]) => SessionData;
  switchToSession: (sessionId: string) => void;
  clearActiveSession: () => void;
  deleteSession: (sessionId: string) => void;

  setActivePersona: (mbti: string) => void;
  setContinuationPersonas: (personas: string[]) => void;
  setSessionStatus: (status: ConversationStatus) => void;
  addTurnToSession: (turn: ConversationTurn) => void;
  setSessionReport: (report: Report) => void;
  updateSelectedCharacters: (characters: string[]) => void;

  updateStreak: () => void;
  incrementInsights: () => void;

  pendingCharacters: string[];
  togglePendingCharacter: (mbti: string) => void;
  clearPendingCharacters: () => void;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export const useSessionStore = create<SessionStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      pendingCharacters: [],

      streak: {
        currentStreak: 0,
        lastSessionDate: null,
        totalSessions: 0,
        insightsCollected: 0,
      },

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        if (!activeSessionId) return null;
        return sessions.find(s => s.sessionId === activeSessionId) ?? null;
      },

      createNewSession: (problem, characters) => {
        const now = new Date().toISOString();
        const newSession: SessionData = {
          sessionId: generateSessionId(),
          problem,
          topicPreview: problem.substring(0, 45),
          selectedCharacters: characters,
          activePersona: null,
          continuationPersonas: [],
          status: 'idle',
          turns: [],
          report: null,
          createdAt: now,
          updatedAt: now,
        };

        set(state => ({
          sessions: [newSession, ...state.sessions].slice(0, 50),
          activeSessionId: newSession.sessionId,
          pendingCharacters: [],
        }));

        return newSession;
      },

      switchToSession: (sessionId) => {
        const session = get().sessions.find(s => s.sessionId === sessionId);
        if (!session) return;
        set({ activeSessionId: sessionId });
      },

      clearActiveSession: () => {
        set({ activeSessionId: null, pendingCharacters: [] });
      },

      deleteSession: (sessionId) => {
        set(state => ({
          sessions: state.sessions.filter(s => s.sessionId !== sessionId),
          activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
        }));
      },

      setActivePersona: (mbti) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, activePersona: mbti, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      setContinuationPersonas: (personas) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, continuationPersonas: personas, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      setSessionStatus: (status) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, status, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      addTurnToSession: (turn) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, turns: [...s.turns, turn], updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      setSessionReport: (report) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, report, status: 'report_ready' as ConversationStatus, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      updateSelectedCharacters: (characters) => {
        const { activeSessionId } = get();
        if (!activeSessionId) return;
        set(state => ({
          sessions: state.sessions.map(s =>
            s.sessionId === activeSessionId
              ? { ...s, selectedCharacters: characters, updatedAt: new Date().toISOString() }
              : s
          ),
        }));
      },

      togglePendingCharacter: (mbti) => {
        const current = get().pendingCharacters;
        if (current.includes(mbti)) {
          set({ pendingCharacters: current.filter(c => c !== mbti) });
        } else if (current.length < 5) {
          set({ pendingCharacters: [...current, mbti] });
        }
      },

      clearPendingCharacters: () => set({ pendingCharacters: [] }),

      updateStreak: () => {
        const { streak } = get();
        const today = getToday();
        if (streak.lastSessionDate === today) return;

        const yesterday = getYesterday();
        const newStreak = streak.lastSessionDate === yesterday
          ? streak.currentStreak + 1
          : 1;

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
        set(state => ({
          streak: {
            ...state.streak,
            insightsCollected: state.streak.insightsCollected + 1,
          },
        }));
      },
    }),
    {
      name: 'inner-council-sessions',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        streak: state.streak,
      }),
    }
  )
);
