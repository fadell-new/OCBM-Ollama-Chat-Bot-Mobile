import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { useAppTheme } from '@/hooks/useAppTheme';
import { APP_VERSION } from '@/lib/appInfo';
import { getModelById } from '@/lib/modelCatalog';
import { goBackOr } from '@/lib/navigation';
import { useChatsStore } from '@/store/chatsStore';
import { useLocalModelStore } from '@/store/localModelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const chatCount = useChatsStore((state) => state.index.length);
  const activeModelId = useLocalModelStore((state) => state.activeModelId);
  const installedModels = useLocalModelStore((state) => state.installed);

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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit profile"
          onPress={() => router.push('/settings/profile')}
          style={({ pressed }) => [styles.profile, pressed && styles.profilePressed]}
        >
          <Avatar name={settings.profile.name} size={64} />
          <View style={styles.profileText}>
            <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
              {settings.profile.name}
            </Text>
            <Text style={[styles.email, { color: theme.textMuted }]} numberOfLines={1}>
              {settings.profile.email || 'Local profile'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
        </Pressable>

        <SectionHeader title="Account Settings" />
        <View>
          <SettingsRow
            label="Profile"
            value={settings.profile.name}
            onPress={() => router.push('/settings/profile')}
          />
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
            label="AI Source"
            value={
              settings.aiSource === 'local'
                ? 'On-device'
                : settings.aiSource === 'ollama'
                  ? 'PC (Ollama)'
                  : 'Auto'
            }
            onPress={() => router.push('/settings/models')}
          />
          <SettingsRow
            label="Model Management"
            value={settings.defaultModel || 'Not selected'}
            onPress={() => router.push('/settings/models')}
          />
          <SettingsRow
            label="On-device AI"
            value={
              activeModelId && installedModels[activeModelId]
                ? (getModelById(activeModelId)?.name ?? 'Ready')
                : 'Not downloaded'
            }
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
            label="Date & Time"
            value={settings.dateTimeMode === 'custom' ? 'Custom' : 'Device time'}
            onPress={() => router.push('/settings/date-time' as any)}
          />
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
  profilePressed: {
    opacity: 0.7,
  },
  profileText: {
    flex: 1,
    minWidth: 0,
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
