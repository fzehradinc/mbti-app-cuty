'use client';

import { useAppStore } from '@/store/useAppStore';
import WelcomeScreen from '@/components/WelcomeScreen';
import CharacterGrid from '@/components/CharacterGrid';
import InviteAnimation from '@/components/InviteAnimation';
import DiscussionBoard from '@/components/DiscussionBoard';
import FinalReport from '@/components/FinalReport';

export default function Home() {
  const currentScreen = useAppStore((state) => state.currentScreen);

  switch (currentScreen) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'selection':
      return <CharacterGrid />;
    case 'invite':
      return <InviteAnimation />;
    case 'discussion':
      return <DiscussionBoard />;
    case 'report':
      return <FinalReport />;
    default:
      return <WelcomeScreen />;
  }
}
