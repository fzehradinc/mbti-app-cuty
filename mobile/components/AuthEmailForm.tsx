import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import { useAuth } from '@/contexts/AuthContext';

type Mode = 'login' | 'signup' | 'forgot';

export default function AuthEmailScreen({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets();
  const { signInWithEmail, signUpWithEmail, resetPassword } = useAuth();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; name?: string }>({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Invalid email';

    if (mode !== 'forgot') {
      if (!password) e.password = 'Password is required';
      else if (password.length < 6) e.password = 'At least 6 characters';
    }

    if (mode === 'signup' && !fullName.trim()) e.name = 'Name is required';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      if (mode === 'forgot') {
        const { error } = await resetPassword(email.trim());
        if (error) {
          Alert.alert('Error', error);
        } else {
          Alert.alert('Success', 'Password reset link sent to your email.');
          setMode('login');
        }
      } else if (mode === 'login') {
        const { error } = await signInWithEmail(email.trim(), password);
        if (error) Alert.alert('Login Failed', error);
      } else {
        const { error } = await signUpWithEmail(email.trim(), password, fullName.trim());
        if (error) {
          Alert.alert('Sign Up Failed', error);
        } else {
          Alert.alert('Check Your Email', 'We sent you a confirmation link. Please verify your email.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'login' ? 'Welcome back' : mode === 'signup' ? 'Create account' : 'Reset password';
  const subtitle =
    mode === 'login'
      ? 'Sign in to continue'
      : mode === 'signup'
        ? 'Join 16TypeTalk'
        : 'Enter your email to receive a reset link';

  return (
    <LinearGradient colors={['#09090C', '#0F0A1A', '#09090C']} style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.root}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Back */}
            <Pressable onPress={onBack} style={styles.backBtn} hitSlop={16}>
              <Ionicons name="arrow-back" size={22} color="#FFFFFF60" />
            </Pressable>

            {/* Header */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>

            {/* Name (signup) */}
            {mode === 'signup' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Full Name</Text>
                <View style={[styles.inputWrap, errors.name && styles.inputError]}>
                  <Ionicons name="person-outline" size={18} color="#FFFFFF30" />
                  <TextInput
                    style={styles.input}
                    value={fullName}
                    onChangeText={(t) => { setFullName(t); setErrors((e) => ({ ...e, name: undefined })); }}
                    placeholder="Your name"
                    placeholderTextColor="#FFFFFF20"
                    autoCapitalize="words"
                    autoComplete="name"
                  />
                </View>
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
              </View>
            )}

            {/* Email */}
            <View style={styles.fieldWrap}>
              <Text style={styles.fieldLabel}>Email</Text>
              <View style={[styles.inputWrap, errors.email && styles.inputError]}>
                <Ionicons name="mail-outline" size={18} color="#FFFFFF30" />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                  placeholder="you@example.com"
                  placeholderTextColor="#FFFFFF20"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Password */}
            {mode !== 'forgot' && (
              <View style={styles.fieldWrap}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View style={[styles.inputWrap, errors.password && styles.inputError]}>
                  <Ionicons name="lock-closed-outline" size={18} color="#FFFFFF30" />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={password}
                    onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#FFFFFF20"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#FFFFFF30"
                    />
                  </Pressable>
                </View>
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              </View>
            )}

            {/* Forgot */}
            {mode === 'login' && (
              <Pressable onPress={() => setMode('forgot')} style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            )}

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={loading}
              style={({ pressed }) => [styles.submitBtn, pressed && { opacity: 0.85 }]}
            >
              <LinearGradient
                colors={['#7C5CFC', '#5B45D6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.submitGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.submitText}>
                    {mode === 'login' ? 'Sign In' : mode === 'signup' ? 'Create Account' : 'Send Reset Link'}
                  </Text>
                )}
              </LinearGradient>
            </Pressable>

            {/* Legal */}
            {mode === 'signup' && (
              <Text style={styles.legalText}>
                By creating an account, you agree to our{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://16typestalk.com/terms')}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text style={styles.legalLink} onPress={() => Linking.openURL('https://16typestalk.com/privacy')}>
                  Privacy Policy
                </Text>
                .
              </Text>
            )}

            {/* Toggle */}
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <Pressable onPress={() => setMode(mode === 'login' ? 'signup' : 'login')}>
                <Text style={styles.toggleLink}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </Pressable>
            </View>

            {/* Login footer links */}
            {mode === 'login' && (
              <View style={styles.loginFooter}>
                <Text
                  style={styles.footerLink}
                  onPress={() => Linking.openURL('https://16typestalk.com/privacy')}
                >
                  Privacy
                </Text>
                <Text style={styles.footerDot}>•</Text>
                <Text
                  style={styles.footerLink}
                  onPress={() => Linking.openURL('https://16typestalk.com/terms')}
                >
                  Terms
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 28 },

  backBtn: { marginBottom: 24, width: 40 },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 32,
    lineHeight: 20,
  },

  fieldWrap: { marginBottom: 18 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    gap: 10,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 6,
    marginLeft: 4,
  },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 24, marginTop: -8 },
  forgotText: { fontSize: 13, color: '#7C5CFC', fontWeight: '500' },

  submitBtn: { marginBottom: 20 },
  submitGradient: {
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },

  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  toggleLabel: { fontSize: 13, color: 'rgba(255,255,255,0.35)' },
  toggleLink: { fontSize: 13, color: '#7C5CFC', fontWeight: '600' },

  legalText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  legalLink: {
    color: '#7C5CFC',
    fontWeight: '500',
  },
  loginFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 16,
  },
  footerLink: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.35)',
    fontWeight: '500',
  },
  footerDot: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.2)',
  },
});
