'use client';

import { useState, useEffect, useRef } from 'react';
import { useSessionStore } from '@/store/sessionStore';
import WelcomeScreen from '@/components/WelcomeScreen';
import CharacterGrid from '@/components/CharacterGrid';
import InviteAnimation from '@/components/InviteAnimation';
import DiscussionBoard from '@/components/DiscussionBoard';
import FinalReport from '@/components/FinalReport';

export type AppScreen = 'welcome' | 'selection' | 'invite' | 'discussion' | 'report';

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>('welcome');
  const hasHydrated = useRef(false);

  const activeSession = useSessionStore(state => {
    const id = state.activeSessionId;
    if (!id) return null;
    return state.sessions.find(s => s.sessionId === id) ?? null;
  });

  // Auto-route ONLY on initial hydration (page refresh / first load).
  // After that, explicit onNavigate calls control the screen.
  useEffect(() => {
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    if (activeSession && activeSession.turns.length > 0 && activeSession.status !== 'report_ready') {
      setScreen('discussion');
    } else if (activeSession && activeSession.status === 'report_ready') {
      setScreen('report');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  switch (screen) {
    case 'welcome':
      return <WelcomeScreen onNavigate={setScreen} />;
    case 'selection':
      return <CharacterGrid onNavigate={setScreen} />;
    case 'invite':
      return <InviteAnimation onNavigate={setScreen} />;
    case 'discussion':
      return <DiscussionBoard onNavigate={setScreen} />;
    case 'report':
      return <FinalReport onNavigate={setScreen} />;
    default:
      return <WelcomeScreen onNavigate={setScreen} />;
  }
}
