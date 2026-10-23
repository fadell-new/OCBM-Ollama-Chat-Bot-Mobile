import * as Device from 'expo-device';
import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { formatBytes } from '@/lib/format';
import { generateLocal, unloadLocalModel } from '@/lib/localInference';
import {
  cancelDownload,
  deleteModel,
  downloadModel,
  getFreeStorageAsync,
  reconcileInstalledModels,
} from '@/lib/modelDownload';
import { GB, LOCAL_MODELS, recommendModel, type DeviceModel } from '@/lib/modelCatalog';
import { useLocalModelStore } from '@/store/localModelStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

const STORAGE_BUFFER_BYTES = 300 * 1024 * 1024;

export default function LocalModelSettingsScreen() {
  const { theme } = useAppTheme();
  const installed = useLocalModelStore((state) => state.installed);
  const activeModelId = useLocalModelStore((state) => state.activeModelId);
  const downloads = useLocalModelStore((state) => state.downloads);
  const lastError = useLocalModelStore((state) => state.lastError);
  const setActive = useLocalModelStore((state) => state.setActive);

  const [freeStorage, setFreeStorage] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totalMemory = Device.totalMemory;
  const recommended = useMemo(() => recommendModel(totalMemory), [totalMemory]);

  const refreshStorage = async () => {
    try {
      setFreeStorage(await getFreeStorageAsync());
    } catch {
      setFreeStorage(null);
    }
  };

  useEffect(() => {
    void reconcileInstalledModels().then(refreshStorage);
  }, []);

  const handleDownload = async (model: DeviceModel) => {
    const run = async () => {
      try {
        await downloadModel(model.id);
      } catch {
        // error is stored in the download state
      } finally {
        void refreshStorage();
      }
    };

    if (freeStorage !== null && freeStorage < model.sizeBytes + STORAGE_BUFFER_BYTES) {
      Alert.alert(
        'Not enough free storage',
        `${model.name} needs ${formatBytes(model.sizeBytes)} plus some working space. Free up storage first?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download anyway', onPress: () => void run() },
        ]
      );
      return;
    }

    await run();
  };

  const handleDelete = (model: DeviceModel) => {
    Alert.alert('Delete model', `Remove ${model.name} from this device?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setBusyId(model.id);
            try {
              if (activeModelId === model.id) {
                await unloadLocalModel();
              }
              await deleteModel(model.id);
            } finally {
              setBusyId(null);
              void refreshStorage();
            }
          })();
        },
      },
    ]);
  };

  const handleUse = async (model: DeviceModel) => {
    setBusyId(model.id);
    try {
      await unloadLocalModel();
      setActive(model.id);
      setTestResult(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleTest = async (model: DeviceModel) => {
    setTestingId(model.id);
    setTestResult(null);
    try {
      if (activeModelId !== model.id) {
        await unloadLocalModel();
        setActive(model.id);
      }
      let response = '';
      await generateLocal({
        prompt: 'Reply with one short sentence saying you are ready.',
        onToken: (token) => {
          response += token;
        },
      });
      setTestResult(response.trim() || 'OK');
    } catch (error) {
      setTestResult(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setTestingId(null);
    }
  };

  const ramLabel = totalMemory ? `${(totalMemory / GB).toFixed(1)} GB` : 'Unknown';
  const archLabel = Device.supportedCpuArchitectures?.join(', ') ?? 'Unknown';

  return (
    <SettingsPage title="On-device AI">
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Run a small AI model directly on this device. No internet, no server. The PC
        Ollama connection (Settings → Connection) is used when no on-device model is
        installed.
      </Text>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.text }]}>This device</Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          {Device.modelName ?? 'Android device'} · RAM {ramLabel}
        </Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          CPU: {archLabel}
        </Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          Free storage: {freeStorage === null ? 'checking…' : formatBytes(freeStorage)}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Recommended for this device</Text>
        <Text style={[styles.recommendedName, { color: theme.text }]}>
          {recommended.name} · {recommended.params}
        </Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          {recommended.description} · {formatBytes(recommended.sizeBytes)} ·{' '}
          {recommended.languages}
        </Text>
        {totalMemory !== null && totalMemory < recommended.minRamBytes ? (
          <Text style={[styles.cardText, { color: theme.danger }]}>
            This device may not have enough RAM for even the smallest model. Use the
            PC Ollama connection instead.
          </Text>
        ) : null}
      </AppCard>

      {lastError ? (
        <AppCard>
          <Text style={[styles.cardTitle, { color: theme.danger }]}>Model error</Text>
          <Text style={[styles.cardText, { color: theme.textMuted }]}>{lastError}</Text>
        </AppCard>
      ) : null}

      {testResult ? (
        <AppCard>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Test result</Text>
          <Text style={[styles.cardText, { color: theme.textMuted }]}>{testResult}</Text>
        </AppCard>
      ) : null}

      {LOCAL_MODELS.map((model) => {
        const record = installed[model.id];
        const download = downloads[model.id];
        const isActive = activeModelId === model.id;
        const isRecommended = recommended.id === model.id;
        const isDownloading = download?.status === 'downloading';
        const hasError = download?.status === 'error';

        return (
          <AppCard key={model.id}>
            <View style={styles.titleRow}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {model.name} · {model.params}
              </Text>
              {isActive ? (
                <Text style={[styles.badge, { backgroundColor: theme.accent, color: theme.onAccent }]}>
                  ACTIVE
                </Text>
              ) : isRecommended ? (
                <Text
                  style={[
                    styles.badge,
                    { backgroundColor: theme.control, color: theme.text },
                  ]}
                >
                  RECOMMENDED
                </Text>
              ) : null}
            </View>

            <Text style={[styles.cardText, { color: theme.textMuted }]}>
              {model.description}
            </Text>
            <Text style={[styles.cardText, { color: theme.textMuted }]}>
              {formatBytes(model.sizeBytes)} · {model.languages} · needs {formatBytes(model.minRamBytes)} RAM
            </Text>

            {isDownloading ? (
              <View style={styles.downloadBlock}>
                <View style={[styles.progressTrack, { backgroundColor: theme.control }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: theme.accentStrong,
                        width: `${Math.round((download?.progress ?? 0) * 100)}%`,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.cardText, { color: theme.textMuted }]}>
                  Downloading… {Math.round((download?.progress ?? 0) * 100)}%
                </Text>
                <AppButton
                  label="Cancel download"
                  variant="secondary"
                  onPress={() => void cancelDownload(model.id)}
                />
              </View>
            ) : record ? (
              <View style={styles.actions}>
                <AppButton
                  label={isActive ? 'In use' : 'Use this model'}
                  variant={isActive ? 'secondary' : 'primary'}
                  disabled={isActive || busyId === model.id}
                  onPress={() => void handleUse(model)}
                />
                <AppButton
                  label="Test"
                  variant="secondary"
                  loading={testingId === model.id}
                  disabled={testingId !== null}
                  onPress={() => void handleTest(model)}
                />
                <AppButton
                  label="Delete"
                  variant="danger"
                  loading={busyId === model.id}
                  disabled={busyId === model.id}
                  onPress={() => handleDelete(model)}
                />
              </View>
            ) : (
              <View style={styles.actions}>
                <AppButton
                  label={hasError ? 'Retry download' : 'Download'}
                  onPress={() => void handleDownload(model)}
                  loading={false}
                />
                {hasError && download?.error ? (
                  <Text style={[styles.cardText, { color: theme.danger }]}>
                    {download.error}
                  </Text>
                ) : null}
              </View>
            )}
          </AppCard>
        );
      })}

      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Models are stored only on this device and can be deleted at any time. All
        options are 2B parameters or smaller to fit a phone.
      </Text>
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
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.subtitle,
  },
  cardText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
    marginTop: spacing.xs,
  },
  recommendedName: {
    fontFamily: fonts.medium,
    fontSize: typeScale.body,
    marginTop: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  badge: {
    fontFamily: fonts.medium,
    fontSize: 10,
    letterSpacing: 0.6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
  },
  downloadBlock: {
    marginTop: spacing.sm,
    gap: spacing.sm,
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
  actions: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
