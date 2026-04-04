import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={16} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.updated}>Last updated: April 2026</Text>

        <Text style={styles.body}>
          16TypeTalk ("we", "our", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard information when you use our mobile application.
        </Text>

        <Text style={styles.sectionHeader}>1. INFORMATION WE COLLECT</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Topics you share:</Text> When you start a discussion, you provide a topic or question. This content is sent to our AI service providers for processing and is not permanently stored on our servers. Once the session ends, the raw text is discarded.{'\n\n'}
          <Text style={styles.bold}>Usage analytics:</Text> We collect anonymous, aggregated usage data such as session counts, feature usage, and app performance metrics. This data cannot be used to identify you personally.{'\n\n'}
          <Text style={styles.bold}>Account information:</Text> If you sign in via Apple Sign In or Google Sign In, we receive a user identifier, display name (if provided), and email address (if provided). We store this information securely and use it solely for authentication purposes.
        </Text>

        <Text style={styles.sectionHeader}>2. HOW WE USE INFORMATION</Text>
        <Text style={styles.body}>
          • To generate MBTI-based AI responses to your submitted topics{'\n'}
          • To create personalized insight reports based on discussion outcomes{'\n'}
          • To improve our service quality and user experience{'\n'}
          • We do NOT sell your personal data to any third party{'\n'}
          • We do NOT share your conversation content with third parties beyond our AI service providers for the sole purpose of generating responses
        </Text>

        <Text style={styles.sectionHeader}>3. DATA STORAGE</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Conversation data:</Text> Your topics and AI responses are processed in real-time. We do not retain conversation content on our servers beyond the duration of your active session.{'\n\n'}
          <Text style={styles.bold}>Reports:</Text> Insight reports generated from your discussions are stored locally on your device using AsyncStorage. They are not uploaded to our servers.{'\n\n'}
          <Text style={styles.bold}>Account data:</Text> We store minimal account information (user ID, display name) necessary for authentication. This data is encrypted and stored securely.
        </Text>

        <Text style={styles.sectionHeader}>4. THIRD-PARTY SERVICES</Text>
        <Text style={styles.body}>
          We use the following third-party services to provide our functionality:{'\n\n'}
          • <Text style={styles.bold}>AI API Providers</Text> (for conversation processing): Your session topics are sent to AI language model providers to generate personality-based responses. These providers process data in accordance with their own privacy policies.{'\n'}
          • <Text style={styles.bold}>Apple Sign In:</Text> Used for secure authentication on iOS devices.{'\n'}
          • <Text style={styles.bold}>Analytics:</Text> We use anonymous analytics to understand usage patterns. No personally identifiable information is shared with analytics providers.
        </Text>

        <Text style={styles.sectionHeader}>5. CHILDREN'S PRIVACY</Text>
        <Text style={styles.body}>
          16TypeTalk is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected personal data from a child under 13, we will take steps to delete that information promptly.
        </Text>

        <Text style={styles.sectionHeader}>6. YOUR RIGHTS</Text>
        <Text style={styles.body}>
          You have the right to:{'\n\n'}
          • Access the personal data we hold about you{'\n'}
          • Request deletion of your account and associated data{'\n'}
          • Opt out of analytics collection{'\n'}
          • Export your locally stored reports
        </Text>

        <Text style={styles.sectionHeader}>7. CHANGES TO THIS POLICY</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by updating the "Last updated" date and, where appropriate, providing in-app notification.
        </Text>

        <Text style={styles.sectionHeader}>8. CONTACT US</Text>
        <Text style={styles.body}>
          If you have any questions about this Privacy Policy, please contact us at:{'\n\n'}
          contact@16typetalk.app
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#09090D',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF08',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    paddingHorizontal: 24,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 6,
  },
  updated: {
    color: '#FFFFFF30',
    fontSize: 12,
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#6B5CE7',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 28,
    marginBottom: 10,
  },
  body: {
    color: '#A0A0B8',
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: '#C0C0D0',
  },
});
