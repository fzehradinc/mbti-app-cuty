import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { trackEvent } from '@/lib/analytics';
import { useT } from '@/lib/translations';
import { ConversationTurn } from '@/types/conversation';

// API base URL — adjust for your deployment
const API_BASE = __DEV__ ? 'http://192.168.1.140:3001' : 'https://your-api.vercel.app';

const PERSONA_COLORS: Record<string, string> = {
  ENTJ: '#FF6B6B', INTJ: '#7EB8D4', ENTP: '#FFD93D', INTP: '#6AABF7',
  ENFJ: '#F87171', INFJ: '#C084FC', ENFP: '#FB923C', INFP: '#4D96FF',
  ESTJ: '#EAB308', ISTJ: '#94A3B8', ESFJ: '#F472B6', ISFJ: '#A16207',
  ESTP: '#F59E0B', ISTP: '#A1A1AA', ESFP: '#F87171', ISFP: '#34D399',
};

interface MessageBubbleData {
  id: string;
  persona: string;
  role: string;
  content: string;
  citation?: string;
}

// ── Typing dots animation ──
function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: -6, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );
    createDotAnim(dot1, 0).start();
    createDotAnim(dot2, 80).start();
    createDotAnim(dot3, 160).start();
  }, []);

  return (
    <View style={typingStyles.container}>
      {[dot1, dot2, dot3].map((dot, i) => (
        <Animated.View
          key={i}
          style={[typingStyles.dot, { transform: [{ translateY: dot }] }]}
        />
      ))}
    </View>
  );
}

const typingStyles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#7C5CFC' },
});

function MessageBubble({ persona, role, content, citation }: Omit<MessageBubbleData, 'id'>) {
  const vis = CHARACTER_VISUALS[persona];
  const borderColor = PERSONA_COLORS[persona] || '#7C5CFC';

  return (
    <View style={[styles.bubble, { borderLeftColor: borderColor }]}>
      {/* Header */}
      <View style={[styles.bubbleHeader, { borderBottomColor: borderColor + '30' }]}>
        <View style={[styles.emojiRing, { backgroundColor: borderColor + '18', borderColor: borderColor + '40' }]}>
          <Text style={styles.bubbleEmoji}>{vis?.emoji || '💬'}</Text>
        </View>
        <Text style={[styles.bubbleMbti, { color: vis?.accentColor || '#7C5CFC' }]}>
          {persona}
        </Text>
        <Text style={styles.bubbleRole}>{role}</Text>
      </View>
      {/* Content */}
      <Text style={styles.bubbleContent}>{content}</Text>
      {/* Citation */}
      {citation ? (
        <View style={[styles.citationBox, { borderLeftColor: borderColor + '50' }]}>
          <Text style={styles.citationText}>"{citation}"</Text>
        </View>
      ) : null}
    </View>
  );
}

export default function TartismaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const scrollRef = useRef<ScrollView>(null);

  const { t, lang } = useT();
  const QUICK_REPLIES = [t.quick_1, t.quick_2, t.quick_3, t.quick_4, t.quick_5];

  const {
    getActiveSession,
    pendingCharacters,
    createNewSession,
    setActivePersona,
    addTurnToSession,
    setSessionStatus,
    setSessionReport,
  } = useSessionStore();

  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<MessageBubbleData[]>([]);
  const [votedPersona, setVotedPersona] = useState<string | null>(null);
  const [showVoteBar, setShowVoteBar] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deepDivePrompt, setDeepDivePrompt] = useState<string | null>(null);
  const [currentTurn, setCurrentTurn] = useState(1);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  const deepDiveAnim = useRef(new Animated.Value(0)).current;

  const session = getActiveSession();
  const characters = session?.selectedCharacters ?? pendingCharacters;

  // Load existing messages from session turns on mount or when session changes
  useEffect(() => {
    const targetSession = session || useSessionStore.getState().sessions.find(s => s.sessionId === id);
    if (targetSession?.turns && targetSession.turns.length > 0) {
      const existingMessages: MessageBubbleData[] = [];
      targetSession.turns.forEach((turn, turnIdx) => {
        Object.entries(turn.responses).forEach(([mbti, resp], i) => {
          const vis = CHARACTER_VISUALS[mbti];
          existingMessages.push({
            id: `existing-${turnIdx}-${i}`,
            persona: mbti,
            role: vis?.label || mbti,
            content: resp.message,
            citation: resp.quote || undefined,
          });
        });
      });
      setMessages(existingMessages);
      setCurrentTurn(targetSession.turns.length + 1);
      setConversationHistory(targetSession.turns as any[]);
      if (targetSession.activePersona) {
        setVotedPersona(targetSession.activePersona);
      }
    } else {
      // Reset state for new/empty sessions
      setMessages([]);
      setCurrentTurn(1);
      setConversationHistory([]);
      setVotedPersona(null);
      setShowVoteBar(false);
    }
  }, [id]);

  // auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [messages.length]);

  // Deep dive prompt animation
  const showDeepDive = useCallback((persona: string) => {
    setDeepDivePrompt(persona);
    Animated.spring(deepDiveAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();

    setTimeout(() => {
      Animated.timing(deepDiveAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setDeepDivePrompt(null));
    }, 5000);
  }, [deepDiveAnim]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    trackEvent('message_sent', { length: text.length });

    let activeSession = session;
    if (id === 'new' && !session) {
      activeSession = createNewSession(text, pendingCharacters);
      trackEvent('session_started', { character_count: pendingCharacters.length });
    }

    const sessionId = activeSession?.sessionId || id;
    const sessionProblem = activeSession?.problem || text;
    const sessionChars = activeSession?.selectedCharacters || pendingCharacters;
    const isRound2 = currentTurn > 1 && votedPersona;

    setInputText('');
    setIsLoading(true);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE}/api/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          conversationId: sessionId,
          problem: sessionProblem,
          characters: isRound2 ? (activeSession?.continuationPersonas?.length ? activeSession.continuationPersonas : [votedPersona]) : sessionChars,
          conversationHistory,
          userVote: votedPersona,
          userMessage: text,
          turnNumber: currentTurn,
          roundType: isRound2 ? 'round2' : 'round1',
          continuationPersonas: activeSession?.continuationPersonas,
          language: lang,
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const apiResponses = data.responses || [];

      const newMessages: MessageBubbleData[] = apiResponses.map((r: any, i: number) => {
        const vis = CHARACTER_VISUALS[r.mbti];
        return {
          id: `msg-${Date.now()}-${i}`,
          persona: r.mbti,
          role: vis?.label || r.mbti,
          content: r.message,
          citation: r.quote || undefined,
        };
      });

      // Store turn for conversation history
      const turnResponses: Record<string, { message: string; quote: string }> = {};
      apiResponses.forEach((r: any) => {
        turnResponses[r.mbti] = { message: r.message, quote: r.quote || '' };
      });

      const newTurn: ConversationTurn = {
        turnNumber: currentTurn,
        roundType: isRound2 ? 'round2' : 'round1',
        userVote: votedPersona,
        userMessage: text,
        responses: turnResponses,
        selectedPersona: votedPersona,
        continuationPersonas: activeSession?.continuationPersonas || [],
        createdAt: new Date(),
      };

      setConversationHistory(prev => [...prev, newTurn]);
      addTurnToSession(newTurn);
      setMessages(prev => [...prev, ...newMessages]);
      setShowVoteBar(true);
      setSessionStatus('awaiting_vote');
      setCurrentTurn(prev => prev + 1);
    } catch (error: any) {
      console.error('API call failed:', error);
      const isTimeout = error?.name === 'AbortError';
      Alert.alert(
        t.error_connection_title,
        isTimeout ? t.error_timeout_msg : t.error_server_msg,
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, id, session, createNewSession, pendingCharacters, characters, currentTurn, votedPersona, conversationHistory, lang, addTurnToSession, setSessionStatus]);

  const voteScale = useRef(new Animated.Value(1)).current;

  const handleVote = useCallback((mbti: string) => {
    Haptics.selectionAsync();
    voteScale.setValue(0.92);
    Animated.spring(voteScale, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
    setVotedPersona(mbti);
    setActivePersona(mbti);
    trackEvent('vote_cast', { persona: mbti });
    setShowVoteBar(false);
    showDeepDive(mbti);
  }, [setActivePersona, showDeepDive, voteScale]);

  const [activeChip, setActiveChip] = useState<string | null>(null);

  const handleQuickReply = useCallback((reply: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInputText(reply);
    setActiveChip(reply);
    setTimeout(() => setActiveChip(null), 600);
  }, []);

  const handleDeepDive = useCallback(() => {
    if (!deepDivePrompt) return;
    trackEvent('deep_dive_started', { persona: deepDivePrompt });
    router.push('/yanita-derinles');
  }, [deepDivePrompt]);

  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    if (isGeneratingReport || !session || conversationHistory.length === 0) return;
    setIsGeneratingReport(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(`${API_BASE}/api/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          problem: session.problem,
          turns: conversationHistory,
          selectedCharacters: session.selectedCharacters,
        }),
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`Report API error: ${response.status}`);
      const report = await response.json();
      report.generatedAt = new Date();
      setSessionReport(report);
      trackEvent('report_generated', { session_id: session.sessionId });
      router.push(`/rapor-detay/${session.sessionId}` as any);
    } catch (error: any) {
      console.error('Report generation failed:', error);
      const isTimeout = error?.name === 'AbortError';
      Alert.alert(
        t.error_report_title,
        isTimeout ? t.error_timeout_msg : t.error_report_msg,
      );
    } finally {
      setIsGeneratingReport(false);
    }
  }, [isGeneratingReport, session, conversationHistory, lang, setSessionReport]);

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.headerBack} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF99" />
            <Text style={styles.headerBackText}>{t.back_home}</Text>
          </Pressable>
          {votedPersona && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>
                1↑ {votedPersona}
              </Text>
            </View>
          )}
          <Pressable
            style={[styles.reportButton, isGeneratingReport && { opacity: 0.5 }]}
            onPress={handleGenerateReport}
            disabled={isGeneratingReport || conversationHistory.length === 0}
            hitSlop={8}
          >
            <Text style={styles.reportText}>
              {isGeneratingReport ? t.report_generating : t.report_label}
            </Text>
          </Pressable>
        </View>

        {/* Problem banner */}
        <View style={styles.problemBanner}>
          <Text style={styles.problemLabel}>{t.active_topic}</Text>
          <Text style={styles.problemText} numberOfLines={1}>
            {session?.problem || t.new_discussion}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {characters.map((mbti) => {
              const vis = CHARACTER_VISUALS[mbti];
              return (
                <View key={mbti} style={[styles.personaTag, { backgroundColor: vis?.bg || '#1A1A2E' }]}>
                  <Text style={[styles.personaTagText, { color: vis?.accentColor || '#7C5CFC' }]}>{mbti}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageScroll}
          contentContainerStyle={styles.messageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionLabel}>{t.round_label}</Text>

          {messages.map((msg) => (
            <MessageBubble key={msg.id} {...msg} />
          ))}

          {isLoading && (
            <View style={styles.loadingBox}>
              {characters.map((mbti) => {
                const vis = CHARACTER_VISUALS[mbti];
                return (
                  <View key={mbti} style={[styles.loadingDot, { backgroundColor: vis?.bg || '#1A1A2E' }]}>
                    <Text style={styles.loadingEmoji}>{vis?.emoji}</Text>
                  </View>
                );
              })}
              <TypingDots />
              <Text style={styles.loadingText}>{t.council_thinking}</Text>
            </View>
          )}
        </ScrollView>

        {/* Vote Bar */}
        {showVoteBar && (
          <View style={styles.voteBar}>
            <Text style={styles.voteLabel}>{t.vote_question}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.voteScroll}>
              {characters.map((mbti) => {
                const vis = CHARACTER_VISUALS[mbti];
                const isVoted = votedPersona === mbti;
                return (
                  <Animated.View key={mbti} style={{ transform: [{ scale: voteScale }] }}>
                    <Pressable
                      style={[
                        styles.voteChip,
                        { borderColor: vis?.accentColor || '#7C5CFC' },
                        isVoted && { backgroundColor: vis?.accentColor || '#7C5CFC' },
                      ]}
                      onPress={() => handleVote(mbti)}
                    >
                      <Text style={styles.voteEmoji}>{vis?.emoji}</Text>
                      <Text style={[
                        styles.voteMbti,
                        { color: isVoted ? '#FFFFFF' : vis?.accentColor || '#7C5CFC' },
                      ]}>{mbti}</Text>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Deep Dive Prompt */}
        {deepDivePrompt && (
          <Animated.View
            style={[
              styles.deepDivePrompt,
              {
                transform: [{
                  translateY: deepDiveAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [100, 0],
                  }),
                }],
                opacity: deepDiveAnim,
              },
            ]}
          >
            <Pressable style={styles.deepDiveButton} onPress={handleDeepDive}>
              <Text style={styles.deepDiveText}>
                {CHARACTER_VISUALS[deepDivePrompt]?.emoji} {deepDivePrompt} ile derinleşmeyi seçin
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#7C5CFC" />
            </Pressable>
          </Animated.View>
        )}

        {/* Quick Replies */}
        <View style={styles.quickRepliesSection}>
          <Text style={styles.quickRepliesLabel}>{t.join_council}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesScroll}
          >
            {QUICK_REPLIES.map((reply) => (
              <Pressable
                key={reply}
                style={({ pressed }) => [styles.quickChip, (pressed || activeChip === reply) && styles.quickChipPressed]}
                onPress={() => handleQuickReply(reply)}
              >
                <Text style={styles.quickChipText}>{reply}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Input */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t.input_placeholder}
            placeholderTextColor="#4A4A6A"
            multiline
            maxLength={500}
          />
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendText}>{t.send_cta}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerBack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 44,
    minWidth: 44,
  },
  headerBackText: { color: '#FFFFFF99', fontSize: 14 },
  activeBadge: {
    backgroundColor: '#7C5CFC20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: { color: '#7C5CFC', fontSize: 12, fontWeight: '700' },
  reportButton: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  reportText: { color: '#7C5CFC', fontSize: 14, fontWeight: '600' },

  // Problem
  problemBanner: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#2D2B4E',
  },
  problemLabel: { color: '#4A4A6A', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  problemText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  tagRow: { flexDirection: 'row' },
  personaTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginRight: 4 },
  personaTagText: { fontSize: 10, fontWeight: '700' },

  // Messages
  messageScroll: { flex: 1 },
  messageContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionLabel: { color: '#4A4A6A', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 16 },

  bubble: {
    backgroundColor: '#1E1B3A',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  bubbleHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, paddingBottom: 10, borderBottomWidth: 0.5 },
  emojiRing: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bubbleEmoji: { fontSize: 15 },
  bubbleMbti: { fontSize: 13, fontWeight: '800' },
  bubbleRole: { color: '#FFFFFF60', fontSize: 12, marginLeft: 'auto' },
  bubbleContent: { color: '#FFFFFFDD', fontSize: 15, lineHeight: 22 },
  citationBox: {
    marginTop: 12,
    borderLeftWidth: 3,
    paddingLeft: 10,
  },
  citationText: { color: '#FFFFFF80', fontSize: 12, fontStyle: 'italic', lineHeight: 18, letterSpacing: 0.2, ...(Platform.OS === 'ios' ? { fontFamily: 'Georgia' } : {}) },

  // Loading
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingDot: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingEmoji: { fontSize: 14 },
  loadingText: { color: '#4A4A6A', fontSize: 13, marginLeft: 4 },

  // Vote bar
  voteBar: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 0.5,
    borderTopColor: '#1E1E30',
  },
  voteLabel: {
    color: '#FFFFFF60',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 14,
    textAlign: 'center',
  },
  voteScroll: { gap: 8, justifyContent: 'center' },
  voteChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    minWidth: 44,
  },
  voteEmoji: { fontSize: 16 },
  voteMbti: { fontSize: 12, fontWeight: '800' },

  // Deep dive
  deepDivePrompt: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  deepDiveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7C5CFC15',
    borderWidth: 1,
    borderColor: '#7C5CFC40',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  deepDiveText: { color: '#7C5CFC', fontSize: 14, fontWeight: '600' },

  // Quick replies
  quickRepliesSection: { paddingHorizontal: 16, paddingTop: 8 },
  quickRepliesLabel: {
    color: '#4A4A6A',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
  },
  quickRepliesScroll: { gap: 8, paddingBottom: 8 },
  quickChip: {
    borderWidth: 1,
    borderColor: '#3D3B5E',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  quickChipPressed: { backgroundColor: '#7C5CFC20', borderColor: '#7C5CFC' },
  quickChipText: { color: '#FFFFFFCC', fontSize: 13 },

  // Input
  inputBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#2D2B4E',
    gap: 8,
  },
  textInput: {
    backgroundColor: '#1E1B3A',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#FFFFFF',
    fontSize: 15,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    backgroundColor: '#7C5CFC',
    borderRadius: 14,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
