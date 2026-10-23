import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { spacing } from '@/theme/typography';

import { Screen } from './Screen';
import { ScreenHeader } from './ScreenHeader';

export type SettingsPageProps = {
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
};

export function SettingsPage({ title, children, footer, onBack }: SettingsPageProps) {
  const { theme } = useAppTheme();

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ScreenHeader title={title} onBack={onBack ?? (() => goBackOr('/settings'))} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, footer ? styles.contentWithFooter : null]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {children}
        </ScrollView>

        {footer ? (
          <View
            style={[
              styles.footer,
              { borderTopColor: theme.border, backgroundColor: theme.bg },
            ]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.xl,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  contentWithFooter: {
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
});
