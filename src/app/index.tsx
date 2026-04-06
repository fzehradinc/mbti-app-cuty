import { useState, useCallback, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Keyboard,
  Animated,
  Easing,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSessionStore, SessionData } from "@/store/sessionStore";
import { CHARACTER_VISUALS } from "@/lib/characterVisuals";
import { useT } from "@/lib/translations";
import { useVoiceRecording, type VoiceState } from "@/hooks/useVoiceRecording";

const { width: SW } = Dimensions.get("window");
const QUICK_COUNCIL_TYPES = ["ENTJ", "INFJ", "ENTP", "ISFP"] as const;

// ── Ambient floating particles ──
const PARTICLE_COUNT = 12;
const PARTICLE_COLORS = [
  "#7C5CFC",
  "#5DCAA5",
  "#A78BFA",
  "#7C5CFC",
  "#5DCAA5",
  "#A78BFA",
  "#7C5CFC",
  "#5DCAA5",
  "#A78BFA",
  "#7C5CFC",
  "#5DCAA5",
  "#A78BFA",
];
function AmbientParticles() {
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      x: new Animated.Value(Math.random() * SW),
      y: new Animated.Value(Math.random() * 600 + 200),
      opacity: new Animated.Value(0),
      size: 2 + Math.random() * 3,
      delay: i * 500,
      color: PARTICLE_COLORS[i],
    })),
  ).current;

  useEffect(() => {
    particles.forEach((p) => {
      const animate = () => {
        p.y.setValue(600 + Math.random() * 200);
        p.x.setValue(Math.random() * SW);
        p.opacity.setValue(0);

        Animated.parallel([
          Animated.timing(p.y, {
            toValue: -20,
            duration: 8000 + Math.random() * 4000,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.opacity, {
              toValue: 0.25,
              duration: 2000,
              useNativeDriver: true,
            }),
            Animated.delay(3000 + Math.random() * 2000),
            Animated.timing(p.opacity, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => animate());
      };
      setTimeout(animate, p.delay);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: p.size / 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [{ translateX: p.x }, { translateY: p.y }],
          }}
        />
      ))}
    </View>
  );
}

// ── Pulsing dot ──
function PulsingDot({ color = "#34D399" }: { color?: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.6,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <Animated.View
      style={{
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

// ── Orbital ring decoration ──
function OrbitalRing() {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 30000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={{
        width: 60,
        height: 60,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Animated.View
        style={{ ...StyleSheet.absoluteFillObject, transform: [{ rotate }] }}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: 30,
            borderWidth: 1,
            borderColor: "#7C5CFC18",
          }}
        />
        <View
          style={{
            position: "absolute",
            top: -2.5,
            left: 27,
            width: 5,
            height: 5,
            borderRadius: 2.5,
            backgroundColor: "#7C5CFC40",
          }}
        />
      </Animated.View>
      <View
        style={{
          position: "absolute",
          width: 42,
          height: 42,
          borderRadius: 21,
          borderWidth: 0.5,
          borderColor: "#A78BFA10",
        }}
      />
      <View
        style={{
          position: "absolute",
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 0.5,
          borderColor: "#5DCAA510",
        }}
      />
    </View>
  );
}

// ── Character preview card ──
const CHAR_COLORS: Record<string, string> = {
  ENTJ: "#FF6B6B",
  INFP: "#4D96FF",
  INTJ: "#A78BFA",
  ENTP: "#FFD93D",
  INFJ: "#6BCB77",
  ISFP: "#FF9F43",
  ENFP: "#FF6B9D",
  INTP: "#74B9FF",
};
const PREVIEW_CHARS = [
  { mbti: "ENTJ", emoji: "\u{26A1}" },
  { mbti: "INFP", emoji: "\u{1F30A}" },
  { mbti: "INTJ", emoji: "\u{1F52D}" },
  { mbti: "ENTP", emoji: "\u{1F4A1}" },
];

// ── Input ambient particles ──
function InputParticles() {
  const dots = useRef(
    Array.from({ length: 4 }, (_, i) => ({
      x: new Animated.Value(20 + Math.random() * (SW - 84)),
      y: new Animated.Value(10 + Math.random() * 40),
      opacity: new Animated.Value(0),
      delay: i * 700,
    })),
  ).current;

  useEffect(() => {
    dots.forEach((d) => {
      const animate = () => {
        d.x.setValue(20 + Math.random() * (SW - 84));
        d.y.setValue(10 + Math.random() * 40);
        d.opacity.setValue(0);
        Animated.sequence([
          Animated.timing(d.opacity, {
            toValue: 0.2,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.delay(1500),
          Animated.timing(d.opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]).start(() => animate());
      };
      setTimeout(animate, d.delay);
    });
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {dots.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: 2,
            height: 2,
            borderRadius: 1,
            backgroundColor: "#7C5CFC",
            opacity: d.opacity,
            transform: [{ translateX: d.x }, { translateY: d.y }],
          }}
        />
      ))}
    </View>
  );
}

// ── CTA shimmer effect ──
function ShimmerCTA({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: any;
}) {
  const shimmerX = useRef(new Animated.Value(-200)).current;
  useEffect(() => {
    const run = () => {
      shimmerX.setValue(-200);
      Animated.timing(shimmerX, {
        toValue: SW + 200,
        duration: 900,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    };
    run();
    const id = setInterval(run, 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <Pressable
      style={({ pressed }) => [style, pressed && styles.ctaPressed]}
      onPress={onPress}
    >
      <LinearGradient
        colors={["#7C5CFC", "#5B45D6"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.ctaGradient, { overflow: "hidden" }]}
      >
        {children}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 60,
            backgroundColor: "#FFFFFF",
            opacity: 0.15,
            transform: [{ translateX: shimmerX }, { skewX: "-15deg" }],
          }}
        />
      </LinearGradient>
    </Pressable>
  );
}

// ── Typewriter text ──
function TypewriterText({ text, style }: { text: string; style?: any }) {
  const [display, setDisplay] = useState("");
  useEffect(() => {
    setDisplay("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 60);
    return () => clearInterval(id);
  }, [text]);
  return <Text style={style}>{display}</Text>;
}

// ── Time ago helper ──
function getTimeAgo(timestamp: number | string, t: any): string {
  const ms =
    typeof timestamp === "number" ? timestamp : new Date(timestamp).getTime();
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t.time_just_now;
  if (mins < 60) return `${mins} ${t.time_min_ago}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${t.time_hr_ago}`;
  const days = Math.floor(hrs / 24);
  return `${days} ${t.time_day_ago}`;
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { sessions, createNewSession, streak, setPendingProblem } =
    useSessionStore();
  const { t } = useT();

  const [topic, setTopic] = useState("");

  const voice = useVoiceRecording({
    onTranscript: (text) =>
      setTopic((prev) => (prev ? prev + " " + text : text)),
  });
  const isVoiceMode = voice.state === "recording";

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Character card stagger entrance
  const charAnims = useRef(
    PREVIEW_CHARS.map(() => ({
      translateX: new Animated.Value(40),
      opacity: new Animated.Value(0),
    })),
  ).current;
  useEffect(() => {
    charAnims.forEach((anim, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }, i * 80);
    });
  }, []);

  const isAnimating =
    voice.state === "recording" ||
    voice.state === "uploading" ||
    voice.state === "transcribing";
  useEffect(() => {
    if (isAnimating) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnimating]);

  const hasInput = topic.trim().length > 0;

  const recentSessions = sessions
    .filter((s) => s.status !== "report_ready")
    .slice(0, 2);

  const fomoCount = 247 + sessions.length * 3;

  const handleQuickCouncil = useCallback(() => {
    if (!topic.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const chars = [...QUICK_COUNCIL_TYPES];
    const newSession = createNewSession(topic.trim(), chars);
    setTopic("");
    router.push(`/tartisma/${newSession.sessionId}`);
  }, [topic, createNewSession]);

  const handleBuildCouncil = useCallback(() => {
    if (!topic.trim()) return;
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPendingProblem(topic.trim());
    router.push("/meclis-kur");
  }, [topic, setPendingProblem]);

  const handleSuggestedTopic = useCallback((suggestion: string) => {
    Haptics.selectionAsync();
    setTopic(suggestion);
  }, []);

  const handleVoiceToggle = useCallback(() => {
    if (voice.isBusy) {
      // If recording, stop and transcribe
      if (voice.state === "recording") {
        voice.stopRecording();
      }
      // If uploading/transcribing, do nothing (prevent duplicate)
      return;
    }
    if (
      voice.state === "error" ||
      voice.state === "no_speech" ||
      voice.state === "timeout"
    ) {
      voice.resetError();
      return;
    }
    // Start recording
    voice.startRecording();
  }, [voice]);

  const handleResumeSession = useCallback((session: SessionData) => {
    Haptics.selectionAsync();
    useSessionStore.getState().switchToSession(session.sessionId);
    router.push(`/tartisma/${session.sessionId}`);
  }, []);

  const suggestions = [
    { text: t.home_suggest_alt_1, icon: "\u{1F4BC}" },
    { text: t.home_suggest_alt_2, icon: "\u{1F4AC}" },
    { text: t.home_suggest_alt_3, icon: "\u{1F9ED}" },
    { text: t.home_suggest_alt_4, icon: "\u{26A1}" },
  ];

  return (
    <LinearGradient
      colors={["#09090C", "#0E0E16", "#12101D"]}
      style={styles.root}
    >
      <AmbientParticles />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View>
              <Text style={styles.brand}>16TypeTalk</Text>
              <Text style={styles.brandSub}>MBTI AI Advisor</Text>
            </View>
          </View>
          {streak.currentStreak > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                {"\u{26A1}"} {streak.currentStreak}
              </Text>
            </View>
          )}
          {!streak.currentStreak && <OrbitalRing />}
        </View>

        {/* ── FOMO Tag ── */}
        <View style={styles.fomoRow}>
          <PulsingDot color="#7C5CFC" />
          <Text style={styles.fomoText}>
            {fomoCount} {t.home_fomo}
          </Text>
        </View>

        {/* ── Hero ── */}
        <View style={styles.heroBlock}>
          <Text style={styles.headline}>
            {t.home_hero_1}
            {"\n"}
            <Text style={styles.headlineAccent}>{t.home_hero_2}</Text>
          </Text>
          <Text style={styles.body}>{t.home_hero_body}</Text>
        </View>

        {/* ── Character Row ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.charRow}
        >
          {PREVIEW_CHARS.map((c, idx) => {
            const vis = CHARACTER_VISUALS[c.mbti];
            const anim = charAnims[idx];
            const charColor =
              CHAR_COLORS[c.mbti] || vis?.accentColor || "#7C5CFC";
            return (
              <Animated.View
                key={c.mbti}
                style={{
                  opacity: anim.opacity,
                  transform: [{ translateX: anim.translateX }],
                }}
              >
                <View
                  style={[
                    styles.charCard,
                    {
                      borderColor: charColor + "30",
                      backgroundColor: charColor + "08",
                    },
                  ]}
                >
                  <Text style={styles.charEmoji}>{vis?.emoji || c.emoji}</Text>
                  <Text style={[styles.charMbti, { color: charColor }]}>
                    {c.mbti}
                  </Text>
                  <Text style={styles.charRole} numberOfLines={1}>
                    {vis?.label || c.mbti}
                  </Text>
                </View>
              </Animated.View>
            );
          })}
          <View style={styles.charCardMore}>
            <Text style={styles.charMoreText}>+12</Text>
            <Text style={styles.charMoreSub}>{t.home_more}</Text>
          </View>
        </ScrollView>

        {/* ── Input Card ── */}
        <View style={styles.inputCard}>
          <InputParticles />
          <Text style={styles.inputLabel}>{t.home_share_topic}</Text>

          {voice.state !== "idle" &&
          voice.state !== "success" &&
          voice.state !== "error" ? (
            <View style={styles.voiceContainer}>
              <Animated.View
                style={[
                  styles.voiceRing,
                  voice.state === "uploading" || voice.state === "transcribing"
                    ? { backgroundColor: "#5DCAA518" }
                    : undefined,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <View
                  style={[
                    styles.voiceDot,
                    voice.state === "uploading" ||
                    voice.state === "transcribing"
                      ? { backgroundColor: "#5DCAA5" }
                      : undefined,
                  ]}
                />
              </Animated.View>
              <Text style={styles.voiceListening}>
                {voice.state === "recording"
                  ? `${t.home_listening} (${voice.durationSec}s)`
                  : voice.state === "uploading"
                    ? "⬆ Uploading..."
                    : voice.state === "transcribing"
                      ? "✨ Transcribing..."
                      : t.home_listening}
              </Text>
              {voice.state === "recording" && (
                <Pressable
                  style={({ pressed }) => [
                    styles.voiceCancelBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={voice.cancelRecording}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={16}
                    color="#EF4444"
                  />
                  <Text style={styles.voiceCancelText}>Cancel</Text>
                </Pressable>
              )}
            </View>
          ) : voice.state === "error" ||
            voice.state === "no_speech" ||
            voice.state === "timeout" ? (
            <View style={styles.voiceContainer}>
              <Ionicons
                name={
                  voice.state === "no_speech"
                    ? "mic-off-outline"
                    : "alert-circle"
                }
                size={40}
                color={voice.state === "no_speech" ? "#F59E0B" : "#EF4444"}
              />
              <Text
                style={[
                  styles.voiceListening,
                  {
                    color: voice.state === "no_speech" ? "#F59E0B" : "#EF4444",
                  },
                ]}
              >
                {voice.errorMessage ?? "Something went wrong"}
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.voiceRetryBtn,
                  pressed && { opacity: 0.7 },
                ]}
                onPress={voice.resetError}
              >
                <Text style={styles.voiceRetryText}>Tekrar dene</Text>
              </Pressable>
            </View>
          ) : (
            <TextInput
              style={styles.topicInput}
              value={topic}
              onChangeText={setTopic}
              placeholder={t.home_input_desc}
              placeholderTextColor="#FFFFFF20"
              multiline
              maxLength={500}
              textAlignVertical="top"
            />
          )}

          {/* Bottom: voice toggle + counter */}
          <View style={styles.inputFooter}>
            <Pressable
              style={({ pressed }) => [
                styles.voiceToggle,
                voice.isBusy && styles.voiceToggleActive,
                pressed && { opacity: 0.7 },
              ]}
              onPress={handleVoiceToggle}
              disabled={
                voice.state === "uploading" || voice.state === "transcribing"
              }
            >
              <Ionicons
                name={
                  voice.state === "recording"
                    ? "stop-circle"
                    : voice.isBusy
                      ? "hourglass-outline"
                      : "mic-outline"
                }
                size={16}
                color={
                  voice.state === "recording"
                    ? "#EF4444"
                    : voice.isBusy
                      ? "#5DCAA5"
                      : "#7C5CFC"
                }
              />
              <Text
                style={[
                  styles.voiceToggleLabel,
                  voice.state === "recording" && { color: "#EF4444" },
                  (voice.state === "uploading" ||
                    voice.state === "transcribing") && { color: "#5DCAA5" },
                ]}
              >
                {voice.state === "recording"
                  ? t.home_voice_stop
                  : voice.state === "uploading"
                    ? "⬆"
                    : voice.state === "transcribing"
                      ? "..."
                      : t.home_voice_write}
              </Text>
            </Pressable>
            {hasInput && (
              <Text style={styles.charCount}>{topic.trim().length}/500</Text>
            )}
          </View>
        </View>

        {/* ── Quick Topic Chips ── */}
        {!hasInput && (
          <View style={styles.chipsBlock}>
            <Text style={styles.sectionLabel}>{t.home_popular}</Text>
            <View style={styles.chipGrid}>
              {suggestions.map((s, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [
                    styles.chip,
                    pressed && styles.chipPressed,
                  ]}
                  onPress={() => handleSuggestedTopic(s.text)}
                >
                  <Text style={styles.chipEmoji}>{s.icon}</Text>
                  <Text style={styles.chipText}>{s.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── CTA Buttons ── */}
        {hasInput && (
          <View style={styles.ctaBlock}>
            <ShimmerCTA style={styles.ctaMain} onPress={handleQuickCouncil}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <View style={styles.ctaCopy}>
                <Text style={styles.ctaTitle}>{t.home_start_council}</Text>
                <Text style={styles.ctaSub}>{t.home_app_picks}</Text>
              </View>
            </ShimmerCTA>
            <Text style={styles.ctaFree}>{t.home_free_label}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.buildBtn,
                pressed && styles.buildBtnPressed,
              ]}
              onPress={handleBuildCouncil}
            >
              <Ionicons name="people-outline" size={18} color="#7C5CFC" />
              <Text style={styles.buildText}>{t.home_pick_panel}</Text>
              <Ionicons name="arrow-forward" size={14} color="#FFFFFF20" />
            </Pressable>
          </View>
        )}

        {/* ── Social Proof ── */}
        <View style={styles.proofCard}>
          <View style={styles.proofStats}>
            <View style={styles.proofStatMini}>
              <Text style={styles.proofStatIcon}>{"\u{1F4AC}"}</Text>
              <Text style={styles.proofNumber}>24K+</Text>
              <Text style={styles.proofLabel}>{t.home_social_sessions}</Text>
            </View>
            <View style={styles.proofStatMini}>
              <Text style={styles.proofStatIcon}>{"\u2B50"}</Text>
              <Text style={styles.proofNumber}>4.9</Text>
              <Text style={styles.proofLabel}>{t.home_social_rating}</Text>
            </View>
            <View style={styles.proofStatMini}>
              <Text style={styles.proofStatIcon}>{"\u{1F9E0}"}</Text>
              <Text style={styles.proofNumber}>16</Text>
              <Text style={styles.proofLabel}>MBTI</Text>
            </View>
          </View>
          <View style={styles.proofLive}>
            <View style={styles.proofAvatars}>
              <Text style={styles.proofAvatar}>{"\u{26A1}"}</Text>
              <Text style={[styles.proofAvatar, { marginLeft: -6 }]}>
                {"\u{1F30A}"}
              </Text>
              <Text style={[styles.proofAvatar, { marginLeft: -6 }]}>
                {"\u{1F52D}"}
              </Text>
              <Text style={[styles.proofAvatar, { marginLeft: -6 }]}>
                {"\u{1F4A1}"}
              </Text>
            </View>
            <TypewriterText
              text={t.home_social_live}
              style={styles.proofLiveText}
            />
            <PulsingDot color="#34D399" />
          </View>
        </View>

        {/* ── Testimonial ── */}
        <View style={styles.testimonialCard}>
          <Text style={styles.testimonialStars}>
            {"\u2605\u2605\u2605\u2605\u2605"}
          </Text>
          <Text style={styles.testimonialQuote}>{t.home_testimonial}</Text>
          <View style={styles.testimonialAuthor}>
            <View style={styles.testimonialAvatarCircle}>
              <Text style={styles.testimonialAvatarEmoji}>{"\u{26A1}"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Text style={styles.testimonialName}>
                  Kerem A. {"\u00b7"} Istanbul
                </Text>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>{"\u2713"} Verified</Text>
                </View>
              </View>
              <Text style={styles.testimonialMeta}>
                {t.home_testimonial_chose}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Recent Sessions ── */}
        {recentSessions.length > 0 && (
          <View style={styles.recentBlock}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionLabel}>{t.home_resume_label}</Text>
              <Pressable
                hitSlop={12}
                onPress={() => router.push("/(tabs)/gecmis")}
              >
                <Text style={styles.seeAll}>{t.home_see_all_short}</Text>
              </Pressable>
            </View>
            {recentSessions.map((session) => {
              const ago = getTimeAgo(session.createdAt, t);
              return (
                <Pressable
                  key={session.sessionId}
                  style={({ pressed }) => [
                    styles.recentCard,
                    pressed && styles.recentCardPressed,
                  ]}
                  onPress={() => handleResumeSession(session)}
                >
                  <View style={styles.recentLeft}>
                    <Text style={styles.recentTopic} numberOfLines={1}>
                      {session.topicPreview || session.problem}
                    </Text>
                    <View style={styles.recentMeta}>
                      {session.selectedCharacters.slice(0, 3).map((mbti) => {
                        const vis = CHARACTER_VISUALS[mbti];
                        return (
                          <Text key={mbti} style={styles.recentDot}>
                            {vis?.emoji || "\u{1F4AC}"}
                          </Text>
                        );
                      })}
                      <Text style={styles.recentMetaLabel}>
                        {session.turns.length} {t.turns_label} \u00b7 {ago}
                      </Text>
                    </View>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={16}
                    color="#7C5CFC60"
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 22 },

  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerLogo: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  brand: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  brandSub: {
    color: "#FFFFFF25",
    fontSize: 9,
    fontWeight: "600",
    letterSpacing: 1,
    marginTop: 1,
  },
  streakBadge: {
    backgroundColor: "#FFFFFF08",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "#FFFFFF0A",
  },
  streakText: {
    color: "#FFFFFF80",
    fontSize: 12,
    fontWeight: "600",
  },

  /* FOMO */
  fomoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  fomoText: {
    color: "#FFFFFF35",
    fontSize: 12,
    letterSpacing: 0.1,
  },

  /* Hero */
  heroBlock: { marginBottom: 20 },
  headline: {
    color: "#FFFFFF",
    fontSize: 36,
    fontWeight: "800",
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: "#7C5CFC",
  },
  body: {
    color: "#6B6B8A",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },

  /* Character Row */
  charRow: {
    gap: 10,
    paddingBottom: 4,
    marginBottom: 20,
  },
  charCard: {
    width: 80,
    height: 100,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  charEmoji: { fontSize: 28 },
  charMbti: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  charRole: {
    fontSize: 10,
    color: "#FFFFFF30",
    fontWeight: "500",
  },
  charCardMore: {
    width: 80,
    height: 100,
    borderRadius: 16,
    backgroundColor: "#FFFFFF04",
    borderWidth: 1,
    borderColor: "#FFFFFF08",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  charMoreText: {
    color: "#FFFFFF50",
    fontSize: 16,
    fontWeight: "700",
  },
  charMoreSub: {
    color: "#FFFFFF20",
    fontSize: 9,
    fontWeight: "500",
  },

  /* Input Card */
  inputCard: {
    backgroundColor: "#FFFFFF08",
    borderRadius: 20,
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: "#FFFFFF0D",
    marginBottom: 14,
  },
  inputLabel: {
    color: "#7C5CFC",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    marginBottom: 10,
  },
  topicInput: {
    color: "#FFFFFF",
    fontSize: 16,
    lineHeight: 24,
    minHeight: 64,
    maxHeight: 140,
    paddingVertical: 0,
  },
  inputFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#FFFFFF0A",
  },
  voiceToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#7C5CFC0A",
  },
  voiceToggleActive: { backgroundColor: "#EF44440F" },
  voiceToggleLabel: {
    color: "#7C5CFC",
    fontSize: 13,
    fontWeight: "500",
  },
  charCount: {
    color: "#FFFFFF20",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },

  /* Voice mode */
  voiceContainer: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 12,
  },
  voiceRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#7C5CFC18",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#7C5CFC",
  },
  voiceListening: {
    color: "#7C5CFC",
    fontSize: 14,
    fontWeight: "500",
  },
  voiceCancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#EF44440A",
  },
  voiceCancelText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "500",
  },
  voiceRetryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#7C5CFC15",
  },
  voiceRetryText: {
    color: "#7C5CFC",
    fontSize: 13,
    fontWeight: "600",
  },

  /* Chips */
  chipsBlock: { marginBottom: 20 },
  sectionLabel: {
    color: "#FFFFFF25",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 10,
    textAlign: "center",
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF05",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF08",
  },
  chipPressed: {
    backgroundColor: "#FFFFFF0D",
    borderColor: "#7C5CFC20",
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    color: "#FFFFFF60",
    fontSize: 13,
  },

  /* CTA */
  ctaBlock: { marginBottom: 20 },
  ctaMain: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 6,
  },
  ctaPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  ctaGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  ctaCopy: { flex: 1 },
  ctaTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  ctaSub: {
    color: "#FFFFFFA0",
    fontSize: 12,
    marginTop: 2,
  },
  ctaFree: {
    color: "#FFFFFF20",
    fontSize: 10,
    textAlign: "center",
    marginBottom: 12,
  },
  buildBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFFFFF05",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF0A",
  },
  buildBtnPressed: {
    backgroundColor: "#FFFFFF0A",
  },
  buildText: {
    color: "#FFFFFF70",
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },

  /* Social proof */
  proofCard: {
    backgroundColor: "#FFFFFF05",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#FFFFFF08",
    marginBottom: 12,
  },
  proofStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 14,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#FFFFFF08",
    gap: 8,
  },
  proofStat: { alignItems: "center" },
  proofStatMini: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#FFFFFF05",
    borderRadius: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#FFFFFF06",
    gap: 2,
  },
  proofStatIcon: {
    fontSize: 16,
    marginBottom: 2,
  },
  proofNumber: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  proofLabel: {
    color: "#FFFFFF30",
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.3,
  },
  proofDivider: {
    width: 1,
    height: 24,
    backgroundColor: "#FFFFFF0A",
  },
  proofLive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proofAvatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  proofAvatar: {
    fontSize: 16,
    backgroundColor: "#FFFFFF0A",
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: "center",
    lineHeight: 24,
    overflow: "hidden",
  },
  proofLiveText: {
    color: "#FFFFFF30",
    fontSize: 11,
    flex: 1,
  },

  /* Testimonial */
  testimonialCard: {
    backgroundColor: "#FFFFFF04",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#FFFFFF06",
    marginBottom: 20,
  },
  testimonialStars: {
    color: "#FFD93D",
    fontSize: 14,
    letterSpacing: 2,
    marginBottom: 10,
  },
  testimonialQuote: {
    color: "#FFFFFF60",
    fontSize: 15,
    lineHeight: 24,
    fontStyle: "italic",
    marginBottom: 14,
  },
  testimonialAuthor: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  testimonialAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#7C5CFC15",
    alignItems: "center",
    justifyContent: "center",
  },
  testimonialAvatarEmoji: { fontSize: 14 },
  testimonialName: {
    color: "#FFFFFF50",
    fontSize: 12,
    fontWeight: "500",
  },
  testimonialMeta: {
    color: "#7C5CFC",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 1,
  },
  verifiedBadge: {
    backgroundColor: "#34D39915",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  verifiedText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "600",
  },

  /* Recent sessions */
  recentBlock: { marginBottom: 12 },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  seeAll: {
    color: "#7C5CFC",
    fontSize: 12,
    fontWeight: "500",
  },
  recentCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF04",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#FFFFFF06",
  },
  recentCardPressed: { backgroundColor: "#FFFFFF0A" },
  recentLeft: { flex: 1, marginRight: 10 },
  recentTopic: {
    color: "#FFFFFF80",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  recentMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  recentDot: { fontSize: 12 },
  recentMetaLabel: {
    color: "#FFFFFF20",
    fontSize: 11,
    marginLeft: 4,
  },
  resumePill: {
    backgroundColor: "#7C5CFC12",
    borderRadius: 8,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});
