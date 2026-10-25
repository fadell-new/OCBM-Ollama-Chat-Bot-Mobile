import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function WebSearchSettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const [saving, setSaving] = useState(false);

  const enabled = settings.webSearchEnabled;

  const toggle = async () => {
    setSaving(true);
    try {
      await update({ webSearchEnabled: !enabled });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPage title="Web Search">
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        When enabled, OCBM searches DuckDuckGo before answering and gives the
        results to your AI model as context. This needs internet access even if
        the AI model itself is on your phone.
      </Text>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Status</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {enabled
            ? 'Enabled: web results are included when answering supported questions.'
            : 'Disabled: chat works fully offline where possible.'}
        </Text>
      </AppCard>

      <AppButton
        label={enabled ? 'Disable web search' : 'Enable web search'}
        variant={enabled ? 'secondary' : 'primary'}
        onPress={() => void toggle()}
        loading={saving}
        disabled={saving}
      />

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>How it works</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          DuckDuckGo results are fetched by the app, then included in the system
          prompt as numbered sources. This is free and does not require an API key.
          Result quality depends on the search and on the model's ability to use
          the context.
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Privacy</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Questions are sent to DuckDuckGo when this is enabled. With it
          disabled, no search request is made.
        </Text>
      </AppCard>

      <Text style={[styles.note, { color: theme.textMuted }]}>
        Web search waits for a network response before generation, so answers may
        take longer. Search is skipped for very short messages.
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
  lead: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 24,
    marginTop: spacing.xs,
  },
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
