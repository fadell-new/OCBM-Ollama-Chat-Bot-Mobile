import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import { ModelRow } from '@/components/ModelRow';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatBytes } from '@/lib/format';
import { unloadLocalModel } from '@/lib/localInference';
import { getModelById, type DeviceModel } from '@/lib/modelCatalog';
import { goBackOr } from '@/lib/navigation';
import { useConnectionStore } from '@/store/connectionStore';
import { useLocalModelStore } from '@/store/localModelStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { AiSource, OllamaModel } from '@/types';

const SOURCE_OPTIONS: { value: AiSource; label: string; description: string }[] = [
  {
    value: 'auto',
    label: 'Auto',
    description: 'Use an on-device model when one is installed, otherwise use the PC.',
  },
  {
    value: 'local',
    label: 'On-device',
    description: 'Always answer on this phone. Download a model in Settings → On-device AI.',
  },
  {
    value: 'ollama',
    label: 'PC (Ollama)',
    description: 'Always use the Ollama server running on your computer.',
  },
];

function supportsChat(model: OllamaModel): boolean {
  if (model.capabilities.length === 0) return true;
  return model.capabilities.includes('completion');
}

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

  const installed = useLocalModelStore((state) => state.installed);
  const activeModelId = useLocalModelStore((state) => state.activeModelId);
  const setActiveModel = useLocalModelStore((state) => state.setActive);

  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  const [saving, setSaving] = useState(false);
  const [pullName, setPullName] = useState('');

  const chatModels = useMemo(() => models.filter(supportsChat), [models]);
  const hiddenModels = useMemo(
    () => models.filter((model) => model.capabilities.length > 0 && !supportsChat(model)),
    [models]
  );

  const installedLocal = useMemo(
    () =>
      Object.keys(installed)
        .map((id) => getModelById(id))
        .filter((model): model is DeviceModel => Boolean(model)),
    [installed]
  );

  useEffect(() => {
    if (!settings.baseUrl) return;
    void refresh(settings.baseUrl);
  }, [refresh, settings.baseUrl]);

  useEffect(() => {
    if (models.length === 0) return;
    setSelectedModel((current) => {
      if (chatModels.some((model) => model.name === current)) return current;
      return chatModels[0]?.name ?? '';
    });
  }, [models, chatModels]);

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

  const useLocalModel = async (id: string) => {
    await unloadLocalModel();
    setActiveModel(id);
    await update({ aiSource: 'local' });
  };

  const progress =
    pulling && typeof pulling.completed === 'number' && typeof pulling.total === 'number'
      ? pulling.completed / pulling.total
      : null;

  const sourceOption =
    SOURCE_OPTIONS.find((option) => option.value === settings.aiSource) ?? SOURCE_OPTIONS[0];

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
        Pick what answers your messages: a model on this phone, the Ollama server on
        your computer, or let OCBM choose automatically.
      </Text>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>AI Source</Text>

        <View style={styles.sourceRow}>
          {SOURCE_OPTIONS.map((option) => {
            const active = settings.aiSource === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => void update({ aiSource: option.value })}
                style={[
                  styles.sourceButton,
                  {
                    backgroundColor: active ? theme.accentStrong : theme.surface,
                    borderColor: active ? theme.accentStrong : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.sourceLabel,
                    { color: active ? theme.onAccent : theme.text },
                  ]}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {sourceOption.description}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>On-device models</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Models downloaded to this phone. They work without the PC.
        </Text>

        {installedLocal.length === 0 ? (
          <>
            <Text style={[styles.helpText, { color: theme.textMuted }]}>
              No on-device model installed yet.
            </Text>
            <AppButton
              label="Manage on-device models"
              variant="secondary"
              onPress={() => router.push('/settings/local-model')}
            />
          </>
        ) : (
          installedLocal.map((model) => {
            const isActive = activeModelId === model.id;
            return (
              <View key={model.id} style={[styles.localRow, { borderColor: theme.border }]}>
                <View style={styles.localInfo}>
                  <Text style={[styles.localName, { color: theme.text }]}>
                    {model.name} · {model.params}
                  </Text>
                  <Text style={[styles.localMeta, { color: theme.textMuted }]}>
                    {formatBytes(model.sizeBytes)}
                    {isActive ? ' · active' : ''}
                  </Text>
                </View>
                <AppButton
                  label={isActive && settings.aiSource === 'local' ? 'In use' : 'Use'}
                  variant="secondary"
                  disabled={isActive && settings.aiSource === 'local'}
                  onPress={() => void useLocalModel(model.id)}
                />
              </View>
            );
          })
        )}

        <AppButton
          label="Download more models"
          variant="ghost"
          onPress={() => router.push('/settings/local-model')}
        />
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Default PC model</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Used when the AI source is PC (Ollama) or when Auto falls back to the PC.
        </Text>

        {chatModels.length === 0 ? (
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            No chat-capable models found. Test the connection or pull a model first.
          </Text>
        ) : null}

        <View>
          {chatModels.map((model) => (
            <ModelRow
              key={model.name}
              model={model}
              defaultSelected={selectedModel === model.name}
              onSelect={(selected) => setSelectedModel(selected.name)}
            />
          ))}
        </View>

        {hiddenModels.length > 0 ? (
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            Hidden (do not support chat): {hiddenModels.map((model) => model.name).join(', ')}
          </Text>
        ) : null}
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Downloaded PC models</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Models available on the Ollama host (chat-capable only).
        </Text>

        {chatModels.length === 0 ? (
          <Text style={[styles.helpText, { color: theme.textMuted }]}>
            No downloaded models yet. Pull one from the Ollama host.
          </Text>
        ) : null}

        <View>
          {chatModels.map((model) => (
            <ModelRow
              key={model.name}
              model={model}
              onDelete={(selected) => void handleDelete(selected)}
            />
          ))}
        </View>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Pull new model</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Pull a new model from the Ollama host. Progress updates while the model
          downloads.
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
                  {
                    backgroundColor: theme.accentStrong,
                    width: `${Math.round((progress ?? 0) * 100)}%`,
                  },
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
    marginTop: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  sourceButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.bubble,
    borderWidth: 1,
  },
  sourceLabel: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
  },
  localRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xs,
  },
  localInfo: {
    flex: 1,
    gap: 2,
  },
  localName: {
    fontFamily: fonts.medium,
    fontSize: typeScale.label,
  },
  localMeta: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
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
