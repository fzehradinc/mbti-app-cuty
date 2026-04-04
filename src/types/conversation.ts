// Conversation System Architecture v2.0 — State Machine Types

export type ConversationStatus =
  | 'idle'                    // No active conversation
  | 'round1_loading'          // Fetching Round 1 responses (all personas)
  | 'round1_ready'            // Round 1 responses displayed
  | 'awaiting_vote'           // User needs to vote for a persona
  | 'awaiting_continuation_select' // User picks who responds in Round 2
  | 'awaiting_input'          // User needs to type a message
  | 'round2_loading'          // Fetching Round 2 response (active persona only)
  | 'round2_ready'            // Round 2 response displayed
  | 'awaiting_deeper_or_report' // User chooses: go deeper or see report
  | 'report_loading'          // Generating final report
  | 'report_ready';           // Report displayed

export interface ConversationTurn {
  turnNumber: number;
  roundType: 'round1' | 'round2';
  userVote: string | null;
  userMessage: string;
  responses: Record<string, { message: string; quote: string }>;
  selectedPersona: string | null;
  continuationPersonas: string[];  // All characters for this round
  createdAt: Date;
}

export interface ConversationSession {
  conversationId: string;
  problem: string;
  selectedCharacters: string[];
  activePersona: string | null;  // Set after vote
  status: ConversationStatus;
  turns: ConversationTurn[];
  createdAt: Date;
}

// Valid status transitions
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
