import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { useT } from '@/lib/translations';

export default function RaporDetayScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useT();

  const session = useSessionStore(state =>
    state.sessions.find(s => s.sessionId === id)
  );
  const report = session?.report;

  if (!session || !report) {
    return (
      <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
        <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
          <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF99" />
            <Text style={styles.backText}>{t.back_home}</Text>
          </Pressable>
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📊</Text>
            <Text style={styles.emptyText}>{t.report_empty}</Text>
            <Text style={styles.emptySubtext}>{t.report_empty_sub}</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF99" />
          <Text style={styles.backText}>{t.back_home}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{t.report_title}</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Problem */}
        <View style={styles.section}>
          <Text style={styles.problemLabel}>{t.active_topic}</Text>
          <Text style={styles.problemText}>{session.problem}</Text>
        </View>

        {/* Core Tension */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TEMEL GERİLİM</Text>
          <Text style={styles.cardText}>{report.coreTension}</Text>
        </View>

        {/* Character Positions */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>KARAKTERLERİN SON SÖZÜ</Text>
          {Object.entries(report.characterPositions).map(([mbti, position]) => {
            const vis = CHARACTER_VISUALS[mbti];
            return (
              <View key={mbti} style={styles.positionRow}>
                <View style={[styles.positionBadge, { backgroundColor: vis?.bg || '#1A1A2E' }]}>
                  <Text style={styles.positionEmoji}>{vis?.emoji || '💬'}</Text>
                  <Text style={[styles.positionMbti, { color: vis?.accentColor || '#7C5CFC' }]}>{mbti}</Text>
                </View>
                <Text style={styles.positionText}>{position}</Text>
              </View>
            );
          })}
        </View>

        {/* Action Paths */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>AKSİYON YOLLARI</Text>
          {report.actionPaths.map((path, i) => (
            <View key={i} style={styles.pathRow}>
              <View style={styles.pathNumber}>
                <Text style={styles.pathNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.pathText}>{path}</Text>
            </View>
          ))}
        </View>

        {/* User Insight */}
        <View style={[styles.card, styles.insightCard]}>
          <Text style={styles.insightLabel}>💡 SENİN İÇGÖRÜN</Text>
          <Text style={styles.insightText}>{report.userInsight}</Text>
        </View>

        {/* Next Step */}
        <View style={[styles.card, styles.nextStepCard]}>
          <Text style={styles.cardLabel}>BU HAFTA YAP</Text>
          <Text style={styles.cardText}>{report.nextStep}</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44 },
  backText: { color: '#FFFFFF99', fontSize: 14 },
  headerTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  section: { marginBottom: 20 },
  problemLabel: { color: '#4A4A6A', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  problemText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },

  card: {
    backgroundColor: '#1A1A2E',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  cardLabel: { color: '#7C5CFC', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 12 },
  cardText: { color: '#E0E0F0', fontSize: 15, lineHeight: 22 },

  positionRow: { marginBottom: 14 },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  positionEmoji: { fontSize: 14 },
  positionMbti: { fontSize: 11, fontWeight: '700' },
  positionText: { color: '#C0C0D0', fontSize: 14, lineHeight: 20 },

  pathRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  pathNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C5CFC20',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  pathNumberText: { color: '#7C5CFC', fontSize: 12, fontWeight: '700' },
  pathText: { color: '#C0C0D0', fontSize: 14, lineHeight: 20, flex: 1 },

  insightCard: { borderColor: '#7C5CFC40', backgroundColor: '#1A1A3E' },
  insightLabel: { color: '#FFD93D', fontSize: 12, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
  insightText: { color: '#FFFFFF', fontSize: 15, lineHeight: 24, fontStyle: 'italic' },

  nextStepCard: { borderColor: '#34D39940' },

  empty: { alignItems: 'center', marginTop: 80, gap: 8 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#4A4A6A', fontSize: 14, textAlign: 'center' },
});
