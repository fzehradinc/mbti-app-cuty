export interface Character {
  mbti: string;
  name: string;
  description: string;
  color: string;
  personality: string;
}

export interface CharacterResponse {
  message: string;
  quote: string;
}

export interface Turn {
  turnNumber: number;
  userVote: string | null;
  userMessage: string;
  responses: Record<string, CharacterResponse>;
  createdAt: Date;
}

export interface Session {
  id: string;
  userId?: string;
  problem: string;
  selectedCharacters: string[];
  language: 'en' | 'tr';
  status: 'active' | 'completed';
  turns: Turn[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Report {
  coreTension: string;
  characterPositions: Record<string, string>;
  actionPaths: string[];
  userInsight: string;
  nextStep: string;
  generatedAt: Date;
}

export type Screen = 'welcome' | 'selection' | 'invite' | 'discussion' | 'report';
