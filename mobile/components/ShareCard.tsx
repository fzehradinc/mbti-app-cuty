import React, { useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';
import { trackEvent } from '@/lib/analytics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ShareCardProps {
  problem: string;
  characters: string[];
  verdict: string;
  votedPersona?: string;
}

export function ShareCard({ problem, characters, verdict, votedPersona }: ShareCardProps) {
  const cardRef = useRef<ViewShot>(null);

  const handleShare = useCallback(async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      trackEvent('share_tapped', { characters: characters.join(',') });

      const uri = await captureRef(cardRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      const isSharingAvailable = await Sharing.isAvailableAsync();
      if (isSharingAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: '16TypeTalk Kararını Paylaş',
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [characters]);

  return (
    <View>
      {/* Capturable Card */}
      <ViewShot ref={cardRef} options={{ format: 'png', quality: 1 }} style={styles.cardWrapper}>
        <LinearGradient colors={['#0D0D1A', '#1A0A2E', '#0D0D1A']} style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardLogo}>16TypeTalk</Text>
            <View style={styles.emojiRow}>
              {characters.map((mbti) => {
                const vis = CHARACTER_VISUALS[mbti];
                return (
                  <View key={mbti} style={[styles.emojiCircle, { backgroundColor: vis?.bg || '#1A1A2E' }]}>
                    <Text style={styles.emojiText}>{vis?.emoji}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Problem */}
          <Text style={styles.cardProblem} numberOfLines={3}>"{problem}"</Text>

          {/* Verdict */}
          <View style={styles.verdictBox}>
            <Text style={styles.verdictLabel}>MECLİSİN KARARI</Text>
            <Text style={styles.verdictText}>{verdict}</Text>
          </View>

          {/* Voted persona */}
          {votedPersona && CHARACTER_VISUALS[votedPersona] && (
            <View style={styles.votedRow}>
              <Text style={styles.votedEmoji}>{CHARACTER_VISUALS[votedPersona].emoji}</Text>
              <Text style={styles.votedText}>
                {CHARACTER_VISUALS[votedPersona].label} ({votedPersona}) etkili oldu
              </Text>
            </View>
          )}

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={styles.divider} />
            <Text style={styles.watermark}>16typetalk.app</Text>
          </View>
        </LinearGradient>
      </ViewShot>

      {/* Share Button */}
      <Pressable
        style={({ pressed }) => [styles.shareButton, pressed && styles.sharePressed]}
        onPress={handleShare}
      >
        <Text style={styles.shareText}>📤 Kartı Paylaş</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    width: SCREEN_WIDTH - 48,
    aspectRatio: 1,
    borderRadius: 24,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  card: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },

  // Header
  cardHeader: { gap: 16 },
  cardLogo: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  emojiRow: { flexDirection: 'row', gap: 8 },
  emojiCircle: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: { fontSize: 20 },

  // Problem
  cardProblem: {
    color: '#FFFFFF99',
    fontSize: 16,
    fontStyle: 'italic',
    lineHeight: 24,
  },

  // Verdict
  verdictBox: {
    borderWidth: 1,
    borderColor: '#7C5CFC40',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  verdictLabel: {
    color: '#7C5CFC',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  verdictText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },

  // Voted
  votedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  votedEmoji: { fontSize: 20 },
  votedText: { color: '#FFFFFF80', fontSize: 13 },

  // Footer
  cardFooter: { gap: 12 },
  divider: { height: 0.5, backgroundColor: '#FFFFFF20' },
  watermark: {
    color: '#FFFFFF40',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 2,
  },

  // Share button
  shareButton: {
    backgroundColor: '#7C5CFC',
    borderRadius: 16,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginHorizontal: 24,
    minHeight: 44,
  },
  sharePressed: { backgroundColor: '#6A4CE0', transform: [{ scale: 0.98 }] },
  shareText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
