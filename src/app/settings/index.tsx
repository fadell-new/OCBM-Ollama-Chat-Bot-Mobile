import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SectionHeader } from '@/components/SectionHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function SettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ScreenHeader title="Settings" onBack={() => router.back()} />
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

        <SectionHeader title="Account" />
        <SettingsRow label="Email" value={settings.profile.email || 'Not set'} />
        <SettingsRow label="Phone" value={settings.profile.phone || 'Not set'} />
        <SettingsRow label="Personal Intelligence" value={settings.personalContext ? 'On' : 'Off'} />

        <SectionHeader title="AI" />
        <SettingsRow label="Connection" value={settings.baseUrl || 'Not set'} />
        <SettingsRow label="Default model" value={settings.defaultModel || 'Not set'} />
        <SettingsRow
          label="Customize AI"
          value={settings.systemPrompt ? 'Custom' : 'Default'}
        />

        <SectionHeader title="Appearance" />
        <SettingsRow
          label="Theme"
          value={
            settings.theme === 'system'
              ? 'System'
              : settings.theme === 'dark'
                ? 'Dark'
                : 'Light'
          }
        />

        <SectionHeader title="About" />
        <SettingsRow label="Version" value="1.0.0" chevron={false} />
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
