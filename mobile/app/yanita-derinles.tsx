import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function YanitaDerinlesScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Yanıtla / Derinleş</Text>
        {/* TODO: Port UserInputBar + quick reply chips */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
