import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import {
  areUpdatesSupported,
  checkForUpdate,
  getCurrentUpdateId,
  restartToUpdate,
  type UpdateStatus,
} from '@/lib/updates';
import { goBackOr } from '@/lib/navigation';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function UpdatesSettingsScreen() {
  const { theme } = useAppTheme();
  const [status, setStatus] = useState<UpdateStatus | null>(null);
  const [checking, setChecking] = useState(false);

  const supported = areUpdatesSupported();
  const updateId = getCurrentUpdateId();

  const check = async () => {
    setChecking(true);
    const result = await checkForUpdate();
    setStatus(result);
    setChecking(false);

    if (result.status === 'downloaded') {
      Alert.alert(
        'Update ready',
        result.message,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart now', onPress: () => void restartToUpdate() },
        ]
      );
    }
  };

  return (
    <SettingsPage title="App Updates">
      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Current build</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Version is shown in Settings → About. Update ID: {updateId ?? 'builtin'}
        </Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {supported
            ? 'Over-the-air updates are available for this build.'
            : 'Over-the-air updates are unavailable in development or web builds.'}
        </Text>
      </AppCard>

      <AppButton
        label="Check for updates"
        onPress={() => void check()}
        loading={checking}
        disabled={!supported || checking}
      />

      {status ? (
        <AppCard>
          <Text style={[styles.helpTitle, { color: theme.text }]}>{status.status}</Text>
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            {status.message}
          </Text>
        </AppCard>
      ) : null}

      <Text style={[styles.note, { color: theme.textMuted }]}>
        OTA updates can refresh JavaScript, settings screens, and bundled assets.
        Native/mobile-runtime changes still require a full APK release.
      </Text>

      <AppButton
        label="Back"
        variant="ghost"
        onPress={() => goBackOr('/settings')}
      />
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  helpTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.subtitle,
    marginBottom: 4,
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
  note: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
});
