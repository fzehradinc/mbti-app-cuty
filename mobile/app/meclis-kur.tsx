import { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSessionStore } from '@/store/sessionStore';
import { CHARACTER_VISUALS } from '@/lib/characterVisuals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 48 - GRID_GAP) / 2;

interface PersonaCardProps {
  mbti: string;
  role: string;
  emoji: string;
  description: string;
  isSelected: boolean;
  onPress: () => void;
}

function PersonaCard({ mbti, role, emoji, description, isSelected, onPress }: PersonaCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isSelected ? styles.cardSelected : styles.cardDefault,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      {isSelected && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkText}>✓</Text>
        </View>
      )}
      <Text style={styles.cardEmoji}>{emoji}</Text>
      <Text style={styles.cardMbti}>{mbti}</Text>
      <Text style={styles.cardRole}>{role}</Text>
      <Text style={styles.cardDesc} numberOfLines={2}>{description}</Text>
    </Pressable>
  );
}

const ALL_TYPES = Object.keys(CHARACTER_VISUALS);

export default function MeclisKurScreen() {
  const insets = useSafeAreaInsets();
  const { pendingCharacters, togglePendingCharacter } = useSessionStore();
  const count = pendingCharacters.length;

  const handleToggle = useCallback((mbti: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    togglePendingCharacter(mbti);
  }, [togglePendingCharacter]);

  const handleConfirm = useCallback(() => {
    if (count < 2) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.push('/tartisma/new');
  }, [count]);

  const badgeColor = count === 0
    ? '#4A4A6A'
    : count < 2
      ? '#F59E0B'
      : '#34D399';

  const renderItem = useCallback(({ item: mbti }: { item: string }) => {
    const vis = CHARACTER_VISUALS[mbti];
    return (
      <PersonaCard
        mbti={mbti}
        role={vis.label}
        emoji={vis.emoji}
        description={vis.tagline}
        isSelected={pendingCharacters.includes(mbti)}
        onPress={() => handleToggle(mbti)}
      />
    );
  }, [pendingCharacters, handleToggle]);

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF99" />
        </Pressable>
        <Text style={styles.headerTitle}>Ekibini Kur</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Grid */}
      <FlatList
        data={ALL_TYPES}
        renderItem={renderItem}
        keyExtractor={(item) => item}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={[styles.pillBadge, { borderColor: badgeColor }]}>
              <Text style={[styles.pillText, { color: badgeColor }]}>
                {count === 0
                  ? '2 ile 5 karakter seç'
                  : count < 2
                    ? `${count} seçili — en az 2 gerekli`
                    : `${count} seçili ✓`}
              </Text>
            </View>
            <Text style={styles.sectionTitle}>{'Kimlerden duymak\nistersin?'}</Text>
            <Text style={styles.sectionSub}>Her ses farklı düşünür.</Text>
          </View>
        }
      />

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        {count > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipScroll}
            style={styles.chipScrollContainer}
          >
            {pendingCharacters.map((mbti) => {
              const vis = CHARACTER_VISUALS[mbti];
              return (
                <View key={mbti} style={[styles.miniChip, { borderColor: vis.accentColor + '60' }]}>
                  <Text style={styles.chipEmoji}>{vis.emoji}</Text>
                  <Text style={[styles.chipMbti, { color: vis.accentColor }]}>{mbti}</Text>
                </View>
              );
            })}
          </ScrollView>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.confirmButton,
            count < 2 && styles.confirmDisabled,
            pressed && count >= 2 && styles.confirmPressed,
          ]}
          onPress={handleConfirm}
          disabled={count < 2}
        >
          <Text style={[styles.confirmText, count < 2 && styles.confirmTextDisabled]}>
            MECLİSİ TOPLA →
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  headerRight: { width: 44 },

  // List header
  listHeader: { paddingHorizontal: 24, marginBottom: 16 },
  pillBadge: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 20,
  },
  pillText: { fontSize: 12, fontWeight: '700' },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 6,
  },
  sectionSub: { color: '#FFFFFF60', fontSize: 14 },

  // Grid
  gridContent: { paddingHorizontal: 18, paddingBottom: 200 },
  gridRow: { gap: GRID_GAP, marginBottom: GRID_GAP },

  // Card
  card: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    gap: 4,
    minHeight: 44,
    position: 'relative',
  },
  cardDefault: {
    backgroundColor: '#1E1B3A',
    borderWidth: 1,
    borderColor: '#2D2B4E',
  },
  cardSelected: {
    backgroundColor: '#2D1B69',
    borderWidth: 2,
    borderColor: '#7C5CFC',
  },
  cardPressed: { opacity: 0.85 },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C5CFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  cardEmoji: { fontSize: 32, marginBottom: 4 },
  cardMbti: { color: '#7C5CFC', fontSize: 14, fontWeight: '800' },
  cardRole: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  cardDesc: { color: '#FFFFFF80', fontSize: 12, lineHeight: 16, marginTop: 2 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D1AEE',
    borderTopWidth: 0.5,
    borderTopColor: '#2D2B4E',
    paddingHorizontal: 24,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: { elevation: 12 },
    }),
  },
  chipScrollContainer: { marginBottom: 12 },
  chipScroll: { gap: 8 },
  miniChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chipEmoji: { fontSize: 14 },
  chipMbti: { fontSize: 11, fontWeight: '800' },
  confirmButton: {
    backgroundColor: '#7C5CFC',
    borderRadius: 16,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
  },
  confirmDisabled: { backgroundColor: '#7C5CFC40' },
  confirmPressed: { backgroundColor: '#6A4CE0', transform: [{ scale: 0.98 }] },
  confirmText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  confirmTextDisabled: { opacity: 0.5 },
});
