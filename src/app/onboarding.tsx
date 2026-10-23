import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const update = useSettingsStore((state) => state.update);

  const finish = async () => {
    await update({ onboardingComplete: true });
    router.replace('/(drawer)');
  };

  return (
    <Screen>
      <View style={styles.root}>
        <View style={styles.hero}>
          <Text style={[styles.kicker, { color: theme.textMuted }]}>WELCOME</Text>
          <Text style={[styles.title, { color: theme.text }]}>OCBM</Text>
          <Text style={[styles.body, { color: theme.textMuted }]}>
            A calm, private chat app for the AI running on your own machine. No
            accounts, no cloud, no noise.
          </Text>
        </View>

        <View style={styles.footer}>
          <AppButton label="Get started" size="lg" onPress={() => void finish()} />
          <Text style={[styles.hint, { color: theme.textMuted }]}>
            Connection and model setup comes next.
          </Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingVertical: spacing.xxxl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  kicker: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 2,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 48,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 25,
    maxWidth: 320,
  },
  footer: {
    gap: spacing.md,
  },
  hint: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    textAlign: 'center',
  },
});
