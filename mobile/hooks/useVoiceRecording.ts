import { useState, useRef, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { transcribeAudio } from '@/lib/transcribe';

export type VoiceState =
  | 'idle'
  | 'permission'
  | 'recording'
  | 'uploading'
  | 'transcribing'
  | 'success'
  | 'error';

interface UseVoiceRecordingOptions {
  /** Called with the transcript text on success */
  onTranscript: (text: string) => void;
  /** Max recording duration in seconds */
  maxDurationSec?: number;
}

interface UseVoiceRecordingReturn {
  /** Current state of the voice recording flow */
  state: VoiceState;
  /** Error message if state is 'error' */
  errorMessage: string | null;
  /** Start the recording flow (requests permission if needed) */
  startRecording: () => Promise<void>;
  /** Stop recording and begin transcription */
  stopRecording: () => Promise<void>;
  /** Cancel recording without transcribing */
  cancelRecording: () => void;
  /** Reset error state back to idle */
  resetError: () => void;
  /** Recording duration in seconds (updates while recording) */
  durationSec: number;
  /** Whether there's an active operation (prevents duplicate submits) */
  isBusy: boolean;
}

const RECORDING_OPTIONS: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
    audioQuality: Audio.IOSAudioQuality.MEDIUM,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
};

export function useVoiceRecording({
  onTranscript,
  maxDurationSec = 120,
}: UseVoiceRecordingOptions): UseVoiceRecordingReturn {
  const [state, setState] = useState<VoiceState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [durationSec, setDurationSec] = useState(0);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const busyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setDurationSec(0);
  }, []);

  const startRecording = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;

    try {
      // Request permission
      setState('permission');
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Microphone Access Required',
          'Please enable microphone access in Settings to use voice input.',
        );
        setState('idle');
        busyRef.current = false;
        return;
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Start recording
      setState('recording');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(RECORDING_OPTIONS);
      await recording.startAsync();
      recordingRef.current = recording;

      // Duration timer
      const startTime = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setDurationSec(elapsed);
        if (elapsed >= maxDurationSec) {
          // Auto-stop at max duration
          stopRecording();
        }
      }, 500);
    } catch (err) {
      console.error('[VoiceRecording] Start error:', err);
      setErrorMessage('Failed to start recording');
      setState('error');
      cleanup();
      busyRef.current = false;
    }
  }, [maxDurationSec, cleanup]);

  const stopRecording = useCallback(async () => {
    const recording = recordingRef.current;
    if (!recording) {
      busyRef.current = false;
      setState('idle');
      return;
    }

    cleanup();

    try {
      // Stop recording
      setState('uploading');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;

      // Reset audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      if (!uri) {
        throw new Error('No recording URI');
      }

      // Transcribe
      setState('transcribing');
      const result = await transcribeAudio(uri);

      if (result.text.trim()) {
        setState('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onTranscript(result.text.trim());

        // Return to idle after brief success indication
        setTimeout(() => {
          setState('idle');
        }, 500);
      } else {
        throw new Error('No speech detected');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Transcription failed';
      console.error('[VoiceRecording] Error:', message);
      setErrorMessage(message);
      setState('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      busyRef.current = false;
    }
  }, [cleanup, onTranscript]);

  const cancelRecording = useCallback(() => {
    const recording = recordingRef.current;
    if (recording) {
      recording.stopAndUnloadAsync().catch(() => {});
      recordingRef.current = null;
    }
    cleanup();
    setState('idle');
    busyRef.current = false;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [cleanup]);

  const resetError = useCallback(() => {
    setErrorMessage(null);
    setState('idle');
  }, []);

  return {
    state,
    errorMessage,
    startRecording,
    stopRecording,
    cancelRecording,
    resetError,
    durationSec,
    isBusy: state !== 'idle' && state !== 'error' && state !== 'success',
  };
}
