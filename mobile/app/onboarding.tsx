import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Dimensions,
  ScrollView,
  Platform,
  Animated,
  Easing,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import PersonalityConstellation from '@/components/PersonalityConstellation';
import { useAuth } from '@/contexts/AuthContext';
import AuthEmailForm from '@/components/AuthEmailForm';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ── Fade-in wrapper using RN Animated ──
function FadeInView({
  children,
  delay = 0,
  duration = 600,
  translateY = 12,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  translateY?: number;
  style?: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translate = useRef(new Animated.Value(translateY)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translate, {
        toValue: 0,
        duration,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[style, { opacity, transform: [{ translateY: translate }] }]}
    >
      {children}
    </Animated.View>
  );
}

export default function OnboardingScreen({
  onContinue,
}: {
  onContinue: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { signInWithApple, signInWithGoogle } = useAuth();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  // Live dot pulse — must be before any conditional returns (Rules of Hooks)
  const livePulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(livePulse, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(livePulse, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const liveDotOpacity = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });
  const liveDotScale = livePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.4],
  });

  const handleAppleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithApple();
    } catch (e: any) {
      if (e?.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign-In Failed', e?.message ?? 'An error occurred');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setAuthLoading(true);
    try {
      await signInWithGoogle();
    } catch (e: any) {
      Alert.alert('Google Sign-In Failed', e?.message ?? 'An error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  if (showEmailForm) {
    return <AuthEmailForm onBack={() => setShowEmailForm(false)} />;
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#09090C', '#0F0A1A', '#09090C']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 20 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ── LOGO / BRAND ── */}
        <FadeInView delay={200} duration={800} translateY={0} style={styles.brandRow}>
          <View style={styles.logoGlow}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <View>
            <Text style={styles.brandName}>16TypeTalk</Text>
            <Text style={styles.brandDescriptor}>Personality × Dialogue</Text>
          </View>
        </FadeInView>

        {/* ── CONSTELLATION HERO ── */}
        <FadeInView delay={400} duration={1200} translateY={0} style={styles.constellationWrap}>
          <PersonalityConstellation />
        </FadeInView>

        {/* ── HEADLINE ── */}
        <FadeInView delay={600} duration={700} style={styles.headlineWrap}>
          <Text style={styles.headline}>
            Meet the voices{'\n'}
            <Text style={styles.headlineAccent}>within.</Text>
          </Text>
        </FadeInView>

        {/* ── SUPPORTING COPY ── */}
        <FadeInView delay={750} duration={600}>
          <Text style={styles.supportText}>
            Explore conversations shaped by personality.{'\n'}
            Understand yourself through type-based dialogue.
          </Text>
        </FadeInView>

        {/* ── LIVE INDICATOR ── */}
        <FadeInView delay={850} duration={500} translateY={0} style={styles.liveRow}>
          <Animated.View
            style={[
              styles.liveDot,
              { opacity: liveDotOpacity, transform: [{ scale: liveDotScale }] },
            ]}
          />
          <Text style={styles.liveText}>
            2,481 conversations happening now
          </Text>
        </FadeInView>

        {/* ── CTA BUTTONS ── */}
        <View style={styles.ctaSection}>
          {/* Apple */}
          <FadeInView delay={900} duration={600}>
            <Pressable
              onPress={handleAppleSignIn}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.appleBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                authLoading && { opacity: 0.6 },
              ]}
            >
              <View style={styles.btnIconWrap}>
                <Text style={styles.appleIcon}>{'\uF8FF'}</Text>
              </View>
              <Text style={styles.appleBtnText}>Continue with Apple</Text>
            </Pressable>
          </FadeInView>

          {/* Google */}
          <FadeInView delay={1000} duration={600}>
            <Pressable
              onPress={handleGoogleSignIn}
              disabled={authLoading}
              style={({ pressed }) => [
                styles.googleBtn,
                pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                authLoading && { opacity: 0.6 },
              ]}
            >
              <View style={styles.btnIconWrap}>
                <Text style={styles.googleIcon}>G</Text>
              </View>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </Pressable>
          </FadeInView>

          {/* Email */}
          <FadeInView delay={1100} duration={500}>
            <Pressable onPress={() => setShowEmailForm(true)} disabled={authLoading} style={styles.emailBtn}>
              <Text style={styles.emailBtnText}>Sign in with email</Text>
            </Pressable>
          </FadeInView>

          {authLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator color="#7C5CFC" size="small" />
            </View>
          )}
        </View>

        {/* ── TAGLINE ── */}
        <FadeInView delay={1200} duration={500} translateY={0}>
          <Text style={styles.tagline}>
            — Where personality types start talking. —
          </Text>
        </FadeInView>

        {/* ── LEGAL ── */}
        <FadeInView delay={1300} duration={400} translateY={0} style={styles.legalWrap}>
          <Text style={styles.legalText}>
            By continuing, you agree to our{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://16typestalk.com/terms')}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.legalLink} onPress={() => Linking.openURL('https://16typestalk.com/privacy')}>Privacy Policy</Text>.
          </Text>
        </FadeInView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090C',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
  },

  // ── Brand
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    alignSelf: 'center',
  },
  logoGlow: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(124,92,252,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 40,
    height: 40,
    borderRadius: 10,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  brandDescriptor: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 1,
  },

  // ── Constellation
  constellationWrap: {
    marginBottom: 4,
    marginHorizontal: -8,
  },

  // ── Headline
  headlineWrap: {
    marginBottom: 12,
  },
  headline: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  headlineAccent: {
    color: '#7C5CFC',
  },

  // ── Support copy
  supportText: {
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 16,
    letterSpacing: 0.1,
  },

  // ── Live
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  liveText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 0.2,
  },

  // ── CTA
  ctaSection: {
    gap: 12,
    marginBottom: 20,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    gap: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#7C5CFC',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
      },
      android: { elevation: 4 },
    }),
  },
  btnIconWrap: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIcon: {
    fontSize: 20,
    color: '#000000',
    marginTop: -2,
  },
  appleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    letterSpacing: 0.2,
  },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 10,
  },
  googleIcon: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    opacity: 0.7,
  },
  googleBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.2,
  },

  emailBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  emailBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: 0.3,
  },

  // ── Tagline
  tagline: {
    fontSize: 12,
    fontWeight: '500',
    fontStyle: 'italic',
    color: '#7C5CFC',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.4,
    opacity: 0.6,
  },

  // ── Legal
  legalWrap: {
    paddingBottom: 8,
  },
  legalText: {
    fontSize: 11,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.2)',
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  legalLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255,255,255,0.35)',
  },

  loadingOverlay: {
    alignItems: 'center',
    paddingTop: 8,
  },
});
