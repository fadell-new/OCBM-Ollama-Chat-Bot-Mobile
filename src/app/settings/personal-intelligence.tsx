import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { PromptPreview } from '@/components/PromptPreview';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { buildSystemPrompt } from '@/lib/chatSend';
import { goBackOr } from '@/lib/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function PersonalIntelligenceScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [value, setValue] = useState(settings.personalContext);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const preview = buildSystemPrompt({
    systemPrompt: settings.systemPrompt,
    personalContext: value,
  });

  const save = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ personalContext: value.trim() });
      goBackOr('/settings');
    } catch {
      setError('Could not save your notes. Try again.');
      setSaving(false);
    }
  };

  const reset = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ personalContext: '' });
      setValue('');
    } catch {
      setError('Could not clear your notes. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title="Personal Intelligence"
      footer={
        <>
          <AppButton label="Save" onPress={() => void save()} loading={saving} />
          <AppButton
            label="Clear notes"
            variant="ghost"
            onPress={() => void reset()}
            disabled={saving || !value.trim()}
          />
        </>
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Keep short, useful notes about yourself that you want OCBM to remember.
        They are added to the system prompt on every chat and never leave this
        device.
      </Text>

      <Text style={[styles.examples, { color: theme.textMuted }]}>
        For example: “I live in Bangkok. I prefer concise answers in English. I’m
        learning React Native.”
      </Text>

      <AppInput
        label="Personal notes"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) setError(undefined);
        }}
        placeholder="What should your AI remember about you?"
        multiline
        inputStyle={styles.editor}
        hint={`${value.length.toLocaleString()} characters`}
      />

      <PromptPreview
        label="System message preview"
        value={preview}
        emptyText="No personal notes yet. Ollama will use its built-in behavior."
        note={
          value.trim()
            ? settings.systemPrompt
              ? 'Your system prompt is sent first; these notes follow after a blank line.'
              : 'With no system prompt, these notes become the system message.'
            : settings.systemPrompt
              ? 'No personal notes yet. Your system prompt is sent unchanged.'
              : undefined
        }
      />

      {error ? (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      ) : null}
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
  examples: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 21,
  },
  editor: {
    minHeight: 160,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
});
