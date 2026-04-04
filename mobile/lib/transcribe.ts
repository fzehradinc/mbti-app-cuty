import { supabase } from './supabase';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';

interface TranscribeResult {
  text: string;
}

/**
 * Send recorded audio to the Supabase Edge Function for transcription.
 * The Edge Function proxies to Wiro → ElevenLabs speech-to-text.
 * API keys never leave the backend.
 */
export async function transcribeAudio(audioUri: string): Promise<TranscribeResult> {
  // Get current session token for auth
  const { data: { session } } = await supabase.auth.getSession();

  // Build multipart form with the audio file
  const formData = new FormData();

  // React Native FormData accepts { uri, name, type } objects
  formData.append('audio', {
    uri: audioUri,
    name: 'recording.m4a',
    type: 'audio/m4a',
  } as unknown as Blob);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/transcribe`, {
    method: 'POST',
    headers: {
      // Supabase Edge Functions require the anon key or a valid JWT
      Authorization: `Bearer ${session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? ''}`,
      'x-client-info': '16typetalk-mobile',
    },
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error ?? `Transcription failed (${response.status})`);
  }

  const result: TranscribeResult = await response.json();
  if (!result.text) {
    throw new Error('Empty transcription result');
  }

  return result;
}
