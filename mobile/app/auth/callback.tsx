import { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabase';

/**
 * Auth callback route — handles deep links from:
 * - Email confirmation: typetalk16://auth/callback?token_hash=...&type=signup
 * - Password reset: typetalk16://auth/callback?token_hash=...&type=recovery
 * - OAuth redirect: typetalk16://auth/callback#access_token=...&refresh_token=...
 */
export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    token_hash?: string;
    type?: string;
    error?: string;
    error_description?: string;
  }>();

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    console.log('[AUTH CALLBACK] Params received:', JSON.stringify(params));

    // Handle errors from Supabase
    if (params.error) {
      console.error('[AUTH CALLBACK] Error:', params.error, params.error_description);
      router.replace('/');
      return;
    }

    // Handle email confirmation / password reset (token_hash flow)
    if (params.token_hash && params.type) {
      console.log('[AUTH CALLBACK] Token hash flow, type:', params.type);
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: params.token_hash,
          type: params.type as 'signup' | 'recovery' | 'email',
        });

        if (error) {
          console.error('[AUTH CALLBACK] verifyOtp error:', error.message);
        } else {
          console.log('[AUTH CALLBACK] verifyOtp success, session:', !!data.session);
        }
      } catch (e: any) {
        console.error('[AUTH CALLBACK] verifyOtp exception:', e.message);
      }

      router.replace('/');
      return;
    }

    // Handle OAuth redirect (access_token in URL fragment)
    if (params.access_token && params.refresh_token) {
      console.log('[AUTH CALLBACK] OAuth token flow');
      try {
        const { error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) {
          console.error('[AUTH CALLBACK] setSession error:', error.message);
        } else {
          console.log('[AUTH CALLBACK] Session set successfully');
        }
      } catch (e: any) {
        console.error('[AUTH CALLBACK] setSession exception:', e.message);
      }

      router.replace('/');
      return;
    }

    // Fallback — no recognized params
    console.warn('[AUTH CALLBACK] No recognized params, redirecting home');
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#7C5CFC" />
      <Text style={styles.text}>Verifying...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#09090C',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  text: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
});
