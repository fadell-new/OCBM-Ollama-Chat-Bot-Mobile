import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { ConfirmDialog } from '@/components/ConfirmDialog';
import { SettingsPage } from '@/components/SettingsPage';
import { SettingsRow } from '@/components/SettingsRow';
import { useAppTheme } from '@/hooks/useAppTheme';
import { APP_NAME, APP_TAGLINE, APP_VERSION, OLLAMA_DOCS_URL } from '@/lib/appInfo';
import { resetApp } from '@/lib/resetApp';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export default function AboutScreen() {
  const { theme } = useAppTheme();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string>();

  const reset = async () => {
    setConfirmVisible(false);
    setError(undefined);
    setResetting(true);

    try {
      await resetApp();
      router.replace('/onboarding');
    } catch {
      setError('Could not reset the app. Try again.');
      setResetting(false);
    }
  };

  return (
    <SettingsPage title="About">
      <View
        style={[
          styles.hero,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border },
        ]}
      >
        <Text style={[styles.brand, { color: theme.text }]}>{APP_NAME}</Text>
        <Text style={[styles.tagline, { color: theme.textMuted }]}>{APP_TAGLINE}</Text>
        <Text style={[styles.version, { color: theme.textMuted }]}>
          Version {APP_VERSION}
        </Text>
      </View>

      <Text style={[styles.body, { color: theme.textMuted }]}>
        OCBM is a calm chat client for the AI running on your own machine. No
        accounts, no cloud, no telemetry. Your conversations and settings stay on
        this device.
      </Text>

      <View>
        <SettingsRow
          label="Ollama documentation"
          value="docs.ollama.com"
          onPress={() => void WebBrowser.openBrowserAsync(OLLAMA_DOCS_URL)}
        />
        <SettingsRow
          label="Reset app"
          destructive
          onPress={() => setConfirmVisible(true)}
        />
      </View>

      {resetting ? (
        <Text style={[styles.message, { color: theme.textMuted }]}>Resetting…</Text>
      ) : null}

      {error ? (
        <Text style={[styles.message, { color: theme.danger }]}>{error}</Text>
      ) : null}

      <Text style={[styles.footerNote, { color: theme.textMuted }]}>
        Built with Expo and Ollama. Designed to work offline, on your terms.
      </Text>

      <ConfirmDialog
        visible={confirmVisible}
        title="Reset app?"
        message="This removes every chat, setting, and local profile detail from this device. It cannot be undone."
        confirmLabel="Reset"
        destructive
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void reset()}
      />
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: 40,
  },
  tagline: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
  },
  version: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: spacing.sm,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
    textAlign: 'center',
  },
  footerNote: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
