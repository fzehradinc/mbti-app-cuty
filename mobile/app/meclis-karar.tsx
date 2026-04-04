import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function MeclisKararScreen() {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient colors={['#0D0D1A', '#1A0A2E']} style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Meclisin Kararı</Text>
        {/* TODO: Port FinalReport component */}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
});
