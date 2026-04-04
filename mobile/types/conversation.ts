// Conversation System Architecture v2.0 — State Machine Types

export type ConversationStatus =
  | 'idle'
  | 'round1_loading'
  | 'round1_ready'
  | 'awaiting_vote'
  | 'awaiting_continuation_select'
  | 'awaiting_input'
  | 'round2_loading'
  | 'round2_ready'
  | 'awaiting_deeper_or_report'
  | 'report_loading'
  | 'report_ready';

export interface ConversationTurn {
  turnNumber: number;
  roundType: 'round1' | 'round2';
  userVote: string | null;
  userMessage: string;
  responses: Record<string, { message: string; quote: string }>;
  selectedPersona: string | null;
  continuationPersonas: string[];
  createdAt: Date;
}

export interface ConversationSession {
  conversationId: string;
  problem: string;
  selectedCharacters: string[];
  activePersona: string | null;
  status: ConversationStatus;
  turns: ConversationTurn[];
  createdAt: Date;
}

export const STATUS_TRANSITIONS: Record<ConversationStatus, ConversationStatus[]> = {
  idle: ['round1_loading'],
  round1_loading: ['round1_ready', 'idle'],
  round1_ready: ['awaiting_vote'],
  awaiting_vote: ['awaiting_continuation_select'],
  awaiting_continuation_select: ['awaiting_input'],
  awaiting_input: ['round2_loading'],
  round2_loading: ['round2_ready', 'awaiting_input'],
  round2_ready: ['awaiting_deeper_or_report'],
  awaiting_deeper_or_report: ['awaiting_input', 'report_loading'],
  report_loading: ['report_ready', 'awaiting_deeper_or_report'],
  report_ready: ['idle'],
};

export function canTransition(from: ConversationStatus, to: ConversationStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
