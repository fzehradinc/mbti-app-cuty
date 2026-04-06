import { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Dimensions,
  Linking,
  Modal,
  Animated,
  Easing,
  Alert,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { useSessionStore } from "@/store/sessionStore";
import { useT, setLang } from "@/lib/translations";
import { useAuth } from "@/contexts/AuthContext";
import { SupportCard } from "@/components/SupportCard";

const SW = Dimensions.get("window").width;

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ── Count-up animated number ──
function CountUp({
  target,
  duration = 1200,
}: {
  target: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    let start = 0;
    const step = Math.max(1, Math.ceil(target / (duration / 30)));
    const id = setInterval(() => {
      start += step;
      if (start >= target) {
        setDisplay(target);
        clearInterval(id);
      } else setDisplay(start);
    }, 30);
    return () => clearInterval(id);
  }, [target]);

  return <Text style={styles.statNumber}>{display}</Text>;
}

// ── Settings Row ──
interface SettingsRowProps {
  icon: IoniconsName;
  label: string;
  value?: string;
  onPress?: () => void;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  danger?: boolean;
}

function SettingsRow({
  icon,
  label,
  value,
  onPress,
  isToggle,
  toggleValue,
  onToggle,
  danger,
}: SettingsRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsRow,
        pressed && !isToggle && styles.settingsRowPressed,
      ]}
      onPress={onPress}
      disabled={isToggle}
    >
      <View style={styles.settingsRowLeft}>
        <Ionicons
          name={icon}
          size={18}
          color={danger ? "#EF444480" : "#FFFFFF40"}
        />
        <Text style={[styles.settingsLabel, danger && { color: "#EF4444" }]}>
          {label}
        </Text>
      </View>
      {isToggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: "#FFFFFF15", true: "#7C5CFC60" }}
          thumbColor={toggleValue ? "#7C5CFC" : "#FFFFFF40"}
        />
      ) : (
        <View style={styles.settingsRowRight}>
          {value && <Text style={styles.settingsValue}>{value}</Text>}
          {!danger && (
            <Ionicons name="chevron-forward" size={14} color="#FFFFFF15" />
          )}
        </View>
      )}
    </Pressable>
  );
}

// ── Language Bottom Sheet ──
function LanguageSheet({
  visible,
  onClose,
  currentLang,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  currentLang: string;
  onSelect: () => void;
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      slideAnim.setValue(400);
    }
  }, [visible]);

  const languages = [
    { code: "tr", label: "Türkçe", flag: "🇹🇷" },
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ko", label: "한국어", flag: "🇰🇷" },
    { code: "ja", label: "日本語", flag: "🇯🇵" },
    { code: "pt", label: "Português", flag: "🇧🇷" },
    { code: "es", label: "Español", flag: "🇪🇸" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.sheetContent,
            {
              paddingBottom: insets.bottom + 20,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {currentLang === "tr" ? "Dil Seçin" : "Select Language"}
          </Text>
          <ScrollView
            style={{ maxHeight: 360 }}
            showsVerticalScrollIndicator={false}
          >
            {languages.map((l) => (
              <Pressable
                key={l.code}
                style={({ pressed }) => [
                  styles.langOption,
                  currentLang === l.code && styles.langOptionActive,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => {
                  if (currentLang !== l.code) setLang(l.code as any);
                  Haptics.selectionAsync();
                  onClose();
                }}
              >
                <Text style={styles.langFlag}>{l.flag}</Text>
                <Text style={styles.langLabel}>{l.label}</Text>
                {currentLang === l.code && (
                  <Ionicons name="checkmark-circle" size={20} color="#7C5CFC" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { streak, sessions } = useSessionStore();
  const { t, lang, toggleLang } = useT();
  const { user, signInWithApple, signOut, deleteAccount } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [langSheetVisible, setLangSheetVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const isSignedIn = !!user;
  const userName =
    user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? "";
  const userEmail = user?.email ?? "";

  const completedCount = sessions.filter(
    (s) => s.status === "report_ready",
  ).length;

  // Avatar gradient ring animation
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);
  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleDeleteAccount = useCallback(async () => {
    setDeletingAccount(true);
    const { error } = await deleteAccount();
    setDeletingAccount(false);
    setDeleteModalVisible(false);
    if (error) {
      Alert.alert(t.auth_error, `${t.delete_account_error}: ${error}`);
    }
  }, [deleteAccount]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(t.profile_sign_out, t.sign_out_confirm, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.profile_sign_out,
        style: "destructive",
        onPress: async () => {
          await signOut();
        },
      },
    ]);
  }, [t, signOut]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      await signInWithApple();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      if (e.code !== "ERR_REQUEST_CANCELED") {
        Alert.alert(t.auth_error, t.auth_apple_failed);
      }
    }
  }, [t, signInWithApple]);

  return (
    <LinearGradient
      colors={["#09090C", "#0E0E16", "#12101D"]}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t.profile_title}</Text>

        {/* ── Account Card with Gradient Border ── */}
        <LinearGradient
          colors={["#7C5CFC40", "#5B45D620", "#7C5CFC10"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.accountGradientBorder}
        >
          <View style={styles.accountCard}>
            {/* Avatar with rotating gradient ring */}
            <View style={styles.avatarOuter}>
              <Animated.View
                style={[styles.avatarGradientRing, { transform: [{ rotate }] }]}
              >
                <LinearGradient
                  colors={["#7C5CFC", "#A78BFA", "#5B45D6", "#7C5CFC"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.avatarGradient}
                />
              </Animated.View>
              <View style={styles.avatarInner}>
                <Image
                  source={require("@/assets/images/logo.png")}
                  style={styles.avatarLogo}
                  resizeMode="contain"
                />
              </View>
            </View>

            <View style={styles.accountInfo}>
              <View style={styles.accountRow}>
                <Text style={styles.accountName}>
                  {isSignedIn && userName ? userName : t.profile_guest}
                </Text>
                <View style={styles.planBadge}>
                  <Text style={styles.planText}>{t.profile_free_plan}</Text>
                </View>
              </View>
              <Text style={styles.accountEmail}>
                {isSignedIn && userEmail ? userEmail : "16TypeTalk"}
              </Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Apple Sign In (HIG-compliant) ── */}
        {Platform.OS === "ios" && !isSignedIn && (
          <View style={styles.appleWrap}>
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={
                AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
              }
              buttonStyle={
                AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
              }
              cornerRadius={14}
              style={styles.appleNativeBtn}
              onPress={handleAppleSignIn}
            />
          </View>
        )}

        {/* ── Stats Grid with Count-up ── */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{"\u{1F525}"}</Text>
            <CountUp target={streak.currentStreak || 0} />
            <Text style={styles.statCardLabel}>{t.profile_streak}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{"\u{1F4AC}"}</Text>
            <CountUp target={streak.totalSessions} />
            <Text style={styles.statCardLabel}>{t.profile_sessions_count}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{"\u{1F4CA}"}</Text>
            <CountUp target={completedCount} />
            <Text style={styles.statCardLabel}>{t.profile_reports_count}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>{"\u{1F4A1}"}</Text>
            <CountUp target={streak.insightsCollected} />
            <Text style={styles.statCardLabel}>{t.profile_insights}</Text>
          </View>
        </View>

        {/* ── Settings ── */}
        <Text style={styles.sectionTitle}>{t.profile_preferences}</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="language-outline"
            label={t.profile_language}
            value={
              {
                tr: "Türkçe",
                en: "English",
                ko: "한국어",
                ja: "日本語",
                pt: "Português",
                es: "Español",
              }[lang]
            }
            onPress={() => {
              Haptics.selectionAsync();
              setLangSheetVisible(true);
            }}
          />
          <View style={styles.settingsDivider} />
          <SettingsRow
            icon="notifications-outline"
            label={t.profile_notifications}
            isToggle
            toggleValue={notificationsEnabled}
            onToggle={setNotificationsEnabled}
          />
        </View>

        <SupportCard />

        <Text style={styles.sectionTitle}>{t.profile_about}</Text>
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="information-circle-outline"
            label={t.profile_version}
            value="1.0.0"
          />
          <View style={styles.settingsDivider} />
          <SettingsRow
            icon="shield-checkmark-outline"
            label={t.profile_privacy}
            onPress={() => Linking.openURL("https://16typestalk.com/privacy")}
          />
          <View style={styles.settingsDivider} />
          <SettingsRow
            icon="document-text-outline"
            label={t.profile_terms}
            onPress={() => Linking.openURL("https://16typestalk.com/terms")}
          />
        </View>

        {/* ── Sign Out ── */}
        <View style={styles.settingsGroup}>
          <SettingsRow
            icon="log-out-outline"
            label={t.profile_sign_out}
            onPress={handleSignOut}
            danger
          />
        </View>

        {/* ── Danger Zone ── */}
        {isSignedIn && (
          <>
            <Text style={[styles.sectionTitle, { color: "#EF444430" }]}>
              {t.danger_zone}
            </Text>
            <View style={styles.settingsGroup}>
              <SettingsRow
                icon="trash-outline"
                label={t.delete_account}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  setDeleteModalVisible(true);
                }}
                danger
              />
            </View>
          </>
        )}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>16TypeTalk</Text>
          <Text style={styles.footerSub}>Personality × Dialogue</Text>
        </View>
      </ScrollView>

      {/* Language Bottom Sheet */}
      <LanguageSheet
        visible={langSheetVisible}
        onClose={() => setLangSheetVisible(false)}
        currentLang={lang}
        onSelect={toggleLang}
      />

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => !deletingAccount && setDeleteModalVisible(false)}
      >
        <View style={styles.deleteOverlay}>
          <View style={styles.deleteModal}>
            <View style={styles.deleteIconWrap}>
              <Ionicons name="warning-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>{t.delete_account_title}</Text>
            <Text style={styles.deleteBody}>{t.delete_account_body}</Text>
            <Pressable
              style={[
                styles.deleteConfirmBtn,
                deletingAccount && { opacity: 0.6 },
              ]}
              onPress={handleDeleteAccount}
              disabled={deletingAccount}
            >
              <Text style={styles.deleteConfirmText}>
                {deletingAccount
                  ? t.delete_account_deleting
                  : t.delete_account_confirm}
              </Text>
            </Pressable>
            <Pressable
              style={styles.deleteCancelBtn}
              onPress={() => setDeleteModalVisible(false)}
              disabled={deletingAccount}
            >
              <Text style={styles.deleteCancelText}>{t.cancel}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: 24 },

  title: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    marginBottom: 24,
  },

  // Account Card
  accountGradientBorder: {
    borderRadius: 18,
    padding: 1.5,
    marginBottom: 14,
  },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0D0D14",
    borderRadius: 17,
    padding: 18,
    gap: 14,
  },
  avatarOuter: {
    width: 62,
    height: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarGradientRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 31,
    overflow: "hidden",
  },
  avatarGradient: {
    flex: 1,
  },
  avatarInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0D0D14",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  accountInfo: { flex: 1 },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountName: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  planBadge: {
    backgroundColor: "#7C5CFC15",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  planText: {
    color: "#7C5CFC",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  accountEmail: {
    color: "#FFFFFF30",
    fontSize: 12,
    marginTop: 3,
  },

  // Apple Sign In
  appleWrap: {
    marginBottom: 24,
  },
  appleNativeBtn: {
    width: "100%",
    height: 50,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    width: (SW - 48 - 10) / 2,
    backgroundColor: "#FFFFFF05",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFFFFF08",
    gap: 4,
  },
  statEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  statNumber: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  statCardLabel: {
    color: "#FFFFFF30",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  // Sections
  sectionTitle: {
    color: "#FFFFFF25",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Settings
  settingsGroup: {
    backgroundColor: "#FFFFFF05",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FFFFFF08",
    marginBottom: 24,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsRowPressed: {
    backgroundColor: "#FFFFFF08",
  },
  settingsRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  settingsLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  settingsRowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  settingsValue: {
    color: "#FFFFFF30",
    fontSize: 13,
  },
  settingsDivider: {
    height: 1,
    backgroundColor: "#FFFFFF06",
    marginLeft: 44,
  },

  // Language Bottom Sheet
  sheetOverlay: {
    flex: 1,
    backgroundColor: "#00000080",
    justifyContent: "flex-end",
  },
  sheetContent: {
    backgroundColor: "#16141E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF15",
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  langOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: "#FFFFFF05",
    borderWidth: 1,
    borderColor: "#FFFFFF08",
  },
  langOptionActive: {
    borderColor: "#7C5CFC40",
    backgroundColor: "#7C5CFC08",
  },
  langFlag: { fontSize: 22 },
  langLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    flex: 1,
  },

  // Delete Account Modal
  deleteOverlay: {
    flex: 1,
    backgroundColor: "#000000AA",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  deleteModal: {
    backgroundColor: "#16141E",
    borderRadius: 20,
    padding: 28,
    width: "100%",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EF444430",
  },
  deleteIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#EF444415",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  deleteTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  deleteBody: {
    color: "#FFFFFF70",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 24,
  },
  deleteConfirmBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  deleteConfirmText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  deleteCancelBtn: {
    paddingVertical: 12,
    width: "100%",
    alignItems: "center",
  },
  deleteCancelText: {
    color: "#FFFFFF50",
    fontSize: 14,
    fontWeight: "500",
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 8,
    gap: 4,
  },
  footerText: {
    color: "#FFFFFF15",
    fontSize: 13,
    fontWeight: "600",
  },
  footerSub: {
    color: "#FFFFFF10",
    fontSize: 11,
  },
});
