import { View, Text, Pressable, FlatList, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore, SessionData } from '@/store/sessionStore';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { useT } from '@/lib/translations';

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const { sessions, switchToSession } = useSessionStore();

  const completedSessions = sessions.filter(s => s.status === 'report_ready' && s.report);

  const handleOpenReport = (session: SessionData) => {
    switchToSession(session.sessionId);
    router.push(`/rapor-detay/${session.sessionId}` as any);
  };

  // Stats for the header
  const totalReports = completedSessions.length;
  const totalVoices = completedSessions.reduce(
    (sum, s) => sum + s.selectedCharacters.length, 0
  );

  return (
    <LinearGradient colors={['#09090C', '#0F0F18', '#13101E']} style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>{t.report_title}</Text>
      </View>

      {/* Summary Stats */}
      {totalReports > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalReports}</Text>
            <Text style={styles.statLabel}>{t.profile_reports_count}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalVoices}</Text>
            <Text style={styles.statLabel}>{t.history_voices}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statValue}>
              {completedSessions.reduce((sum, s) => sum + s.turns.length, 0)}
            </Text>
            <Text style={styles.statLabel}>{t.history_turns}</Text>
          </View>
        </View>
      )}

      <FlatList
        data={completedSessions}
        keyExtractor={(item) => item.sessionId}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const report = item.report;
          return (
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handleOpenReport(item)}
            >
              {/* Card header */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.completedDot} />
                  <Text style={styles.cardDate}>{formatDate(item.updatedAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color="#FFFFFF20" />
              </View>

              {/* Topic */}
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.topicPreview || item.problem}
              </Text>

              {/* Core tension preview */}
              {report?.coreTension && (
                <View style={styles.tensionPreview}>
                  <Text style={styles.tensionLabel}>{t.report_tension}</Text>
                  <Text style={styles.tensionText} numberOfLines={2}>
                    {report.coreTension}
                  </Text>
                </View>
              )}

              {/* Personas row */}
              <View style={styles.personasRow}>
                {item.selectedCharacters.slice(0, 5).map((mbti) => {
                  const vis = CHARACTER_VISUALS[mbti];
                  return (
                    <View key={mbti} style={[styles.personaChip, { backgroundColor: (vis?.accentColor || '#7C5CFC') + '15' }]}>
                      <Text style={styles.personaEmoji}>{vis?.emoji || '💬'}</Text>
                      <Text style={[styles.personaLabel, { color: vis?.accentColor || '#7C5CFC' }]}>{mbti}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Bottom stats */}
              <View style={styles.cardFooter}>
                <Text style={styles.footerMeta}>
                  {item.turns.length} {t.history_turns} · {item.selectedCharacters.length} {t.history_voices}
                </Text>
                {report?.actionPaths && (
                  <Text style={styles.footerPaths}>
                    {report.actionPaths.length} {t.report_paths.toLowerCase()}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="analytics-outline" size={40} color="#FFFFFF15" />
            </View>
            <Text style={styles.emptyTitle}>{t.report_empty}</Text>
            <Text style={styles.emptySubtext}>{t.report_empty_sub}</Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => router.push('/')}
            >
              <Text style={styles.emptyBtnText}>{t.report_new}</Text>
            </Pressable>
          </View>
        }
        ListFooterComponent={
          completedSessions.length > 0 ? (
            <View style={styles.encourageBlock}>
              <Text style={styles.encourageText}>
                {t.report_encouragement}
              </Text>
              <Pressable
                style={styles.encourageBtn}
                onPress={() => router.push('/')}
              >
                <Text style={styles.encourageBtnText}>
                  {t.report_encouragement_btn}
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF05',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
    alignItems: 'center',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#FFFFFF08',
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
  },
  statLabel: {
    color: '#FFFFFF30',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  list: { paddingHorizontal: 24, paddingBottom: 40 },

  // Card
  card: {
    backgroundColor: '#FFFFFF05',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#FFFFFF08',
    gap: 12,
  },
  cardPressed: {
    backgroundColor: '#FFFFFF10',
    borderColor: '#34D39920',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  cardDate: {
    color: '#FFFFFF30',
    fontSize: 11,
    fontWeight: '600',
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
  },

  tensionPreview: {
    backgroundColor: '#FFFFFF04',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#7C5CFC30',
  },
  tensionLabel: {
    color: '#7C5CFC',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  tensionText: {
    color: '#FFFFFF50',
    fontSize: 13,
    lineHeight: 18,
  },

  personasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  personaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  personaEmoji: { fontSize: 12 },
  personaLabel: {
    fontSize: 10,
    fontWeight: '700',
  },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerMeta: {
    color: '#FFFFFF20',
    fontSize: 11,
    fontWeight: '500',
  },
  footerPaths: {
    color: '#34D39960',
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty
  empty: {
    alignItems: 'center',
    marginTop: 80,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF05',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    color: '#FFFFFF60',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#FFFFFF25',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
  emptyBtn: {
    marginTop: 12,
    backgroundColor: '#7C5CFC15',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: '#7C5CFC',
    fontSize: 13,
    fontWeight: '600',
  },

  // Encouragement footer
  encourageBlock: {
    marginTop: 24,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  encourageText: {
    fontSize: 13,
    color: '#FFFFFF30',
    textAlign: 'center',
    lineHeight: 20,
  },
  encourageBtn: {
    marginTop: 16,
    backgroundColor: '#7C5CFC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  encourageBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
