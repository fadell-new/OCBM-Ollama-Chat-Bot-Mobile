import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import { ModelRow } from '@/components/ModelRow';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';
import type { OllamaModel } from '@/types';

export default function ModelManagementScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const models = useConnectionStore((state) => state.models);
  const error = useConnectionStore((state) => state.error);
  const pulling = useConnectionStore((state) => state.pulling);
  const refresh = useConnectionStore((state) => state.refresh);
  const startPull = useConnectionStore((state) => state.startPull);
  const cancelPull = useConnectionStore((state) => state.cancelPull);
  const removeModel = useConnectionStore((state) => state.removeModel);

  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  const [saving, setSaving] = useState(false);
  const [pullName, setPullName] = useState('');

  useEffect(() => {
    if (!settings.baseUrl) return;
    void refresh(settings.baseUrl);
  }, [refresh, settings.baseUrl]);

  const save = async () => {
    if (!selectedModel) return;

    setSaving(true);
    try {
      await update({ defaultModel: selectedModel });
      setSaving(false);
      goBackOr('/settings');
    } catch {
      setSaving(false);
    }
  };

  const runPull = async () => {
    const name = pullName.trim();
    if (!name) return;

    await startPull(settings.baseUrl, name);
  };

  const handleDelete = async (model: OllamaModel) => {
    if (!settings.baseUrl) return;

    await removeModel(settings.baseUrl, model.name);
  };

  const progress =
    pulling && typeof pulling.completed === 'number' && typeof pulling.total === 'number'
      ? pulling.completed / pulling.total
      : null;

  return (
    <SettingsPage
      title="Model Management"
      footer={
        <AppButton
          label="Save"
          onPress={() => void save()}
          loading={saving}
          disabled={!selectedModel || saving}
        />
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Choose which local model answers you, pull new models, and remove the
        ones you no longer use.
      </Text>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Default Model</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          The default model is used when you start a new chat and is sent with every request.
        </Text>

        {models.length === 0 ? (
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            No models loaded. Test the connection or pull a model first.
          </Text>
        ) : null}

        <View>
          {models.map((model) => (
            <ModelRow
              key={model.name}
              model={model}
              defaultSelected={selectedModel === model.name}
              onSelect={(selected) => setSelectedModel(selected.name)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Downloaded Models</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Models downloaded on this device through Ollama.
        </Text>

        {models.length === 0 ? (
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            No downloaded models yet. Pull one from the Ollama host.
          </Text>
        ) : null}

        <View>
          {models.map((model) => (
            <ModelRow key={model.name} model={model} onDelete={(selected) => void handleDelete(selected)} />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Pull New Model</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Pull a new model from the Ollama host. Progress updates while the model downloads.
        </Text>

        <AppInput
          label="Model name"
          value={pullName}
          onChangeText={setPullName}
          placeholder="qwen2.5:3b-instruct"
          returnKeyType="done"
          onSubmitEditing={() => void runPull()}
        />

        <AppButton
          label="Pull"
          onPress={() => void runPull()}
          loading={Boolean(pulling)}
          disabled={!pullName.trim() || Boolean(pulling)}
        />

        {pulling ? (
          <View style={styles.pullStatus}>
            <Text style={[styles.pullText, { color: theme.text }]}>
              {`${pulling.name} · ${pulling.status}`}
            </Text>
            <View style={[styles.progressTrack, { backgroundColor: theme.control }]}>
              <View
                style={[
                  styles.progressFill,
                  { backgroundColor: theme.accentStrong, width: `${Math.round((progress ?? 0) * 100)}%` },
                ]}
              />
            </View>
            <AppButton label="Cancel" variant="secondary" onPress={() => cancelPull()} />
          </View>
        ) : null}

        {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}
      </AppCard>
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
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
  },
  pullStatus: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  pullText: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
