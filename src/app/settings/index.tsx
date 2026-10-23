import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { useAppTheme } from '@/hooks/useAppTheme';
import { APP_VERSION } from '@/lib/appInfo';
import { goBackOr } from '@/lib/navigation';
import { useChatsStore } from '@/store/chatsStore';
import { useLocalModelStore } from '@/store/localModelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const chatCount = useChatsStore((state) => state.index.length);
  const localModelStatus = useLocalModelStore((state) => state.status);

  const themeLabel =
    settings.theme === 'system'
      ? 'System'
      : settings.theme === 'dark'
        ? 'Dark'
        : 'Light';

  const connectionValue = settings.baseUrl
    ? settings.baseUrl.replace(/^https?:\/\//, '')
    : 'Not configured';

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ScreenHeader title="Settings" onBack={() => goBackOr('/(drawer)')} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profile}>
          <Avatar name={settings.profile.name} size={64} />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: theme.text }]}>
              {settings.profile.name}
            </Text>
            <Text style={[styles.email, { color: theme.textMuted }]}>
              {settings.profile.email || 'Local profile'}
            </Text>
          </View>
        </View>

        <SectionHeader title="Account Settings" />
        <View>
          <SettingsRow
            label="Email"
            value={settings.profile.email || 'Not set'}
            onPress={() => router.push('/settings/email')}
          />
          <SettingsRow
            label="Phone Number"
            value={settings.profile.phone || 'Not set'}
            onPress={() => router.push('/settings/phone')}
          />
          <SettingsRow
            label="Personal Intelligence"
            value={settings.personalContext ? 'On' : 'Off'}
            onPress={() => router.push('/settings/personal-intelligence')}
          />
        </View>

        <SectionHeader title="AI Settings" />
        <View>
          <SettingsRow
            label="Connection Settings"
            value={connectionValue}
            onPress={() => router.push('/settings/connection')}
          />
          <SettingsRow
            label="Model Management"
            value={settings.defaultModel || 'Not selected'}
            onPress={() => router.push('/settings/models')}
          />
          <SettingsRow
            label="On-device AI"
            value={localModelStatus === 'ready' ? 'Ready' : 'Not downloaded'}
            onPress={() => router.push('/settings/local-model')}
          />
          <SettingsRow
            label="Customize AI"
            value={settings.systemPrompt ? 'Custom' : 'Default'}
            onPress={() => router.push('/settings/customize')}
          />
        </View>

        <SectionHeader title="General and UI" />
        <View>
          <SettingsRow
            label="Theme"
            value={themeLabel}
            onPress={() => router.push('/settings/theme')}
          />
          <SettingsRow
            label="Chat History Management"
            value={`${chatCount} ${chatCount === 1 ? 'chat' : 'chats'}`}
            onPress={() => router.push('/settings/history')}
          />
        </View>

        <SectionHeader title="About" />
        <View>
          <SettingsRow
            label="About OCBM"
            value={`v${APP_VERSION}`}
            onPress={() => router.push('/settings/about')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  profileText: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    fontFamily: fonts.heading,
    fontSize: typeScale.title,
  },
  email: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
});
