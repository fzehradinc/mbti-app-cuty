import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, Image, View } from 'react-native';
import { useT } from '@/lib/translations';

const TAB_BAR_BG = '#09090C';
const ACTIVE_TINT = '#7C5CFC';
const INACTIVE_TINT = '#FFFFFF20';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function TabLayout() {
  const { t } = useT();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_TINT,
        tabBarInactiveTintColor: INACTIVE_TINT,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav_home,
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <View style={[styles.homeIconWrap, focused && styles.homeIconFocused]}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={[styles.homeIconImg, !focused && { opacity: 0.35 }]}
                resizeMode="contain"
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gecmis"
        options={{
          title: t.nav_history,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rapor"
        options={{
          title: t.nav_report,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="analytics-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profil"
        options={{
          title: t.nav_profile,
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: TAB_BAR_BG,
    borderTopColor: '#FFFFFF06',
    borderTopWidth: 0.5,
    height: Platform.OS === 'ios' ? 85 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 6,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  tabBarItem: {
    minHeight: 44,
  },
  homeIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  homeIconFocused: {
    shadowColor: '#7C5CFC',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  homeIconImg: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
});
