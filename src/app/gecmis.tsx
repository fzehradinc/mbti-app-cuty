import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSessionStore, SessionData } from "@/store/sessionStore";
import { CHARACTER_VISUALS } from "@/lib/characterVisuals";
import { useT } from "@/lib/translations";
import { BottomBanner } from "@/components/BottomBanner";

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(dateStr: string, t: any): string {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === now.toDateString()) return t.history_today;
  if (d.toDateString() === yesterday.toDateString()) return t.history_yesterday;
  return d
    .toLocaleDateString(undefined, { day: "numeric", month: "short" })
    .toUpperCase();
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, switchToSession } = useSessionStore();
  const { t } = useT();

  const handleOpenSession = (session: SessionData) => {
    switchToSession(session.sessionId);
    if (session.status === "report_ready" && session.report) {
      router.push(`/rapor-detay/${session.sessionId}` as any);
    } else {
      router.push(`/tartisma/${session.sessionId}`);
    }
  };

  // Separate in-progress from completed
  const inProgress = sessions.filter((s) => s.status !== "report_ready");

  // Group all by date
  const grouped = sessions.reduce<Record<string, SessionData[]>>((acc, s) => {
    const key = formatDate(s.createdAt, t);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});
  const sections = Object.entries(grouped);

  // Most recent in-progress session for the banner
  const continueBanner = inProgress.length > 0 ? inProgress[0] : null;

  const renderSessionCard = (session: SessionData) => {
    const isComplete = session.status === "report_ready";
    return (
      <Pressable
        key={session.sessionId}
        style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
        onPress={() => handleOpenSession(session)}
      >
        <View style={styles.cardTop}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {session.topicPreview || session.problem}
          </Text>
          <Text style={styles.cardTime}>{formatTime(session.createdAt)}</Text>
        </View>

        <View style={styles.cardMiddle}>
          <View style={styles.cardPersonas}>
            {session.selectedCharacters.slice(0, 4).map((mbti) => {
              const vis = CHARACTER_VISUALS[mbti];
              return (
                <View
                  key={mbti}
                  style={[
                    styles.personaDot,
                    { backgroundColor: vis?.accentColor || "#7C5CFC" },
                  ]}
                />
              );
            })}
            <Text style={styles.cardMeta}>
              {session.selectedCharacters.length} {t.history_voices} ·{" "}
              {session.turns.length} {t.history_turns}
            </Text>
          </View>
        </View>

        <View style={styles.cardBottom}>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: isComplete ? "#34D39912" : "#7C5CFC12" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isComplete ? "#34D399" : "#7C5CFC" },
              ]}
            />
            <Text
              style={[
                styles.statusLabel,
                { color: isComplete ? "#34D399" : "#7C5CFC" },
              ]}
            >
              {isComplete ? t.history_completed : t.history_in_progress}
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <LinearGradient
      colors={["#09090C", "#0F0F18", "#13101E"]}
      style={styles.root}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>{t.history_title}</Text>
        <Text style={styles.countBadge}>{sessions.length}</Text>
      </View>

      {/* Continue Banner */}
      {continueBanner && (
        <Pressable
          style={({ pressed }) => [
            styles.continueBanner,
            pressed && { opacity: 0.9 },
          ]}
          onPress={() => handleOpenSession(continueBanner)}
        >
          <View style={styles.continueLeft}>
            <Ionicons name="play-circle" size={20} color="#7C5CFC" />
            <View style={styles.continueTextGroup}>
              <Text style={styles.continueBannerLabel}>
                {t.history_continue_banner}
              </Text>
              <Text style={styles.continueBannerTitle} numberOfLines={1}>
                {continueBanner.topicPreview || continueBanner.problem}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#FFFFFF30" />
        </Pressable>
      )}

      <FlatList
        data={sections}
        keyExtractor={([label]) => label}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item: [label, items] }) => (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{label}</Text>
            {items.map(renderSessionCard)}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="time-outline" size={40} color="#FFFFFF15" />
            </View>
            <Text style={styles.emptyText}>{t.history_empty}</Text>
            <Text style={styles.emptySubtext}>{t.history_empty_sub}</Text>
          </View>
        }
      />
      <BottomBanner />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 8,
    gap: 10,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  countBadge: {
    color: "#FFFFFF30",
    fontSize: 14,
    fontWeight: "600",
    backgroundColor: "#FFFFFF08",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  // Continue banner
  continueBanner: {
    marginHorizontal: 24,
    marginVertical: 12,
    backgroundColor: "#7C5CFC10",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#7C5CFC20",
  },
  continueLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  continueTextGroup: { flex: 1 },
  continueBannerLabel: {
    color: "#7C5CFC",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  continueBannerTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },

  list: { paddingHorizontal: 24, paddingBottom: 100 },

  section: { marginBottom: 20 },
  sectionLabel: {
    color: "#FFFFFF25",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
  },

  card: {
    backgroundColor: "#FFFFFF05",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#FFFFFF08",
    gap: 10,
  },
  cardPressed: {
    backgroundColor: "#FFFFFF10",
    borderColor: "#7C5CFC25",
  },

  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 21,
    flex: 1,
    marginRight: 12,
  },
  cardTime: {
    color: "#FFFFFF25",
    fontSize: 11,
    fontWeight: "500",
  },

  cardMiddle: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardPersonas: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  personaDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardMeta: {
    color: "#FFFFFF25",
    fontSize: 11,
    marginLeft: 8,
    fontWeight: "500",
  },

  cardBottom: {
    flexDirection: "row",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Empty
  empty: {
    alignItems: "center",
    marginTop: 80,
    gap: 10,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFFFFF05",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyText: {
    color: "#FFFFFF60",
    fontSize: 15,
    fontWeight: "600",
  },
  emptySubtext: {
    color: "#FFFFFF25",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 19,
  },
});
