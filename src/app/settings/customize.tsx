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

export default function CustomizeScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [value, setValue] = useState(settings.systemPrompt);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const preview = buildSystemPrompt({
    systemPrompt: value,
    personalContext: settings.personalContext,
  });

  const save = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ systemPrompt: value.trim() });
      goBackOr('/settings');
    } catch {
      setError('Could not save the system prompt. Try again.');
      setSaving(false);
    }
  };

  const reset = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ systemPrompt: '' });
      setValue('');
    } catch {
      setError('Could not reset the system prompt. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title="Customize AI"
      footer={
        <>
          <AppButton label="Save" onPress={() => void save()} loading={saving} />
          <AppButton
            label="Reset to default"
            variant="ghost"
            onPress={() => void reset()}
            disabled={saving || !value.trim()}
          />
        </>
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Set the instructions OCBM sends before every conversation. Leave this
        empty to use Ollama’s built-in behavior.
      </Text>

      <AppInput
        label="System prompt"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) setError(undefined);
        }}
        placeholder="You are a concise, thoughtful assistant. Prefer plain language and short examples."
        multiline
        inputStyle={styles.editor}
        hint={`${value.length.toLocaleString()} characters`}
      />

      <PromptPreview
        label="Prompt sent to Ollama"
        value={preview}
        emptyText="No custom system prompt. Ollama will use its built-in behavior."
        note={
          settings.personalContext
            ? value.trim()
              ? 'Your Personal Intelligence notes are appended after this prompt.'
              : 'Your Personal Intelligence notes become the system message while this is empty.'
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
  editor: {
    minHeight: 160,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
});
