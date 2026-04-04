import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { Alert, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { makeRedirectUri } from 'expo-auth-session';
import * as Linking from 'expo-linking';
import { sha256 } from 'js-sha256';
import { supabase } from '@/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');
let googleSignInModuleCache: GoogleSignInModule | null | undefined;

function getGoogleSignInModule(): GoogleSignInModule | null {
  if (googleSignInModuleCache !== undefined) {
    return googleSignInModuleCache;
  }
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    googleSignInModuleCache = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    googleSignInModuleCache = require('@react-native-google-signin/google-signin') as GoogleSignInModule;
    return googleSignInModuleCache;
  } catch {
    googleSignInModuleCache = null;
    return null;
  }
}

// expo-web-browser — safe in Expo Go, lazy-load as fallback
let WebBrowser: typeof import('expo-web-browser') | null = null;
try {
  WebBrowser = require('expo-web-browser');
  WebBrowser?.maybeCompleteAuthSession();
} catch {
  // Will be loaded lazily when needed
}

interface AuthState {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string, fullName?: string) => Promise<{ error: string | null }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[AUTH] Initializing auth state...');
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      console.log('[AUTH] Initial session:', s ? `user=${s.user.email}` : 'none');
      setSession(s);
      if (s?.user) upsertProfile(s.user);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('[AUTH] Auth state changed:', event, s ? `user=${s.user.email}` : 'no session');
      setSession(s);
      if (s?.user) upsertProfile(s.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Deep Link Listener ──
  // Handles auth callback URLs even when Stack navigator isn't mounted
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      if (!url || !url.includes('auth/callback')) return;
      console.log('[AUTH DEEP LINK] Received:', url);

      try {
        const parsed = new URL(url);
        const hashParams = new URLSearchParams(
          parsed.hash ? parsed.hash.substring(1) : '',
        );
        const queryParams = parsed.searchParams;

        // Check for errors
        const error = queryParams.get('error') || hashParams.get('error');
        if (error) {
          const desc = queryParams.get('error_description') || hashParams.get('error_description');
          console.error('[AUTH DEEP LINK] Error:', error, desc);
          return;
        }

        // Email confirmation / password reset (token_hash flow)
        const tokenHash = queryParams.get('token_hash') || hashParams.get('token_hash');
        const type = queryParams.get('type') || hashParams.get('type');
        if (tokenHash && type) {
          console.log('[AUTH DEEP LINK] Verifying OTP, type:', type);
          const { data, error: otpError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'recovery' | 'email',
          });
          if (otpError) {
            console.error('[AUTH DEEP LINK] verifyOtp error:', otpError.message);
          } else {
            console.log('[AUTH DEEP LINK] verifyOtp success, session:', !!data.session);
          }
          return;
        }

        // OAuth token flow (access_token in hash fragment)
        const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
        if (accessToken && refreshToken) {
          console.log('[AUTH DEEP LINK] Setting session from tokens');
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) {
            console.error('[AUTH DEEP LINK] setSession error:', sessionError.message);
          } else {
            console.log('[AUTH DEEP LINK] Session set successfully');
          }
          return;
        }

        console.warn('[AUTH DEEP LINK] No recognized params in URL');
      } catch (e: any) {
        console.error('[AUTH DEEP LINK] Parse error:', e.message);
      }
    };

    // Check if app was opened via a deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[AUTH DEEP LINK] Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Listen for deep links while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => subscription.remove();
  }, []);

  const upsertProfile = async (user: User) => {
    const meta = user.user_metadata ?? {};
    await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email ?? null,
        full_name: meta.full_name ?? meta.name ?? null,
        avatar_url: meta.avatar_url ?? meta.picture ?? null,
        provider: user.app_metadata?.provider ?? 'email',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  };

  // ── Apple Sign-In ──
  const signInWithApple = useCallback(async () => {
    console.log('[AUTH] Apple Sign-In started');
    if (Platform.OS !== 'ios') {
      Alert.alert('Error', 'Apple Sign-In is only available on iOS.');
      return;
    }

    const AppleAuthentication = require('expo-apple-authentication');

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let rawNonce = '';
    for (let i = 0; i < 64; i++) {
      rawNonce += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const hashedNonce = sha256(rawNonce);
    console.log('[AUTH] Apple nonce generated');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      throw new Error('No identity token from Apple');
    }
    console.log('[AUTH] Apple credential received, has identityToken');

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    if (error) {
      console.error('[AUTH] Apple signInWithIdToken error:', error.message);
      throw error;
    }
    console.log('[AUTH] Apple Sign-In successful');

    if (credential.fullName?.givenName) {
      const fullName = [credential.fullName.givenName, credential.fullName.familyName]
        .filter(Boolean)
        .join(' ');
      await supabase.auth.updateUser({ data: { full_name: fullName } });
    }
  }, []);

  // ── Google Sign-In (Native; omitted in Expo Go — no RNGoogleSignin in binary) ──
  useEffect(() => {
    const mod = getGoogleSignInModule();
    if (!mod) return;
    mod.GoogleSignin.configure({
      webClientId: process.env.GOOGLE_SIGNIN_WEB_CLIENT_ID,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const mod = getGoogleSignInModule();
    if (!mod) {
      Alert.alert(
        'Google Sign-In',
        'Bu özellik Expo Go içinde kullanılamaz. Google ile giriş için development build veya mağaza sürümü gerekir (ör. npx expo run:ios / run:android).'
      );
      return;
    }
    const { GoogleSignin, statusCodes } = mod;
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      if (response.type === 'cancelled') {
        console.log('[AUTH] Google Sign-In cancelled by user');
        return;
      }
      const idToken = response.data.idToken;
      if (!idToken) throw new Error('No idToken from Google');
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: idToken,
      });
      if (error) {
        console.error('[AUTH] Google signInWithIdToken error:', error.message);
        throw error;
      }
      console.log('[AUTH] Google Sign-In successful');
    } catch (err: any) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('[AUTH] Google Sign-In cancelled by user');
      } else if (err.code === statusCodes.IN_PROGRESS) {
        console.log('[AUTH] Google Sign-In already in progress');
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available or outdated.');
      } else {
        console.error('[AUTH] Google Sign-In error:', err.message);
        Alert.alert('Error', err.message);
      }
    }
  }, []);

  // ── Email Sign-In ──
  const signInWithEmail = useCallback(async (email: string, password: string) => {
    console.log('[AUTH] Email Sign-In for:', email);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) console.error('[AUTH] Email Sign-In error:', error.message);
    else console.log('[AUTH] Email Sign-In successful');
    return { error: error?.message ?? null };
  }, []);

  // ── Email Sign-Up ──
  const signUpWithEmail = useCallback(async (email: string, password: string, fullName?: string) => {
    const redirectUri = makeRedirectUri({ scheme: 'typetalk16', path: 'auth/callback' });
    console.log('[AUTH] Email Sign-Up for:', email, 'redirectUri:', redirectUri);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName ?? '' },
        emailRedirectTo: redirectUri,
      },
    });
    if (error) console.error('[AUTH] Email Sign-Up error:', error.message);
    else console.log('[AUTH] Email Sign-Up successful, confirmation email sent');
    return { error: error?.message ?? null };
  }, []);

  // ── Reset Password ──
  const resetPassword = useCallback(async (email: string) => {
    const redirectUri = makeRedirectUri({ scheme: 'typetalk16', path: 'auth/callback' });
    console.log('[AUTH] Password reset for:', email, 'redirectUri:', redirectUri);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUri,
    });
    if (error) console.error('[AUTH] Password reset error:', error.message);
    else console.log('[AUTH] Password reset email sent');
    return { error: error?.message ?? null };
  }, []);

  // ── Sign Out ──
  const signOut = useCallback(async () => {
    console.log('[AUTH] Signing out');
    await supabase.auth.signOut();
    setSession(null);
    console.log('[AUTH] Signed out');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signInWithApple,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        resetPassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
