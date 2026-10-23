import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { deleteLocalModel, downloadLocalModel, getLocalModelPath, isLocalModelDownloaded } from '@/lib/modelDownload';
import { generateLocal, isLocalModelReady, loadLocalModel, unloadLocalModel } from '@/lib/localInference';
import { useLocalModelStore, LOCAL_MODEL_NAME, LOCAL_MODEL_SIZE_BYTES } from '@/store/localModelStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export default function LocalModelSettingsScreen() {
  const { theme } = useAppTheme();
  const status = useLocalModelStore((state) => state.status);
  const progress = useLocalModelStore((state) => state.progress);
  const error = useLocalModelStore((state) => state.error);
  const path = useLocalModelStore((state) => state.path);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string>();

  useEffect(() => {
    void isLocalModelDownloaded().then((exists) => {
      const store = useLocalModelStore.getState();
      if (exists && store.status !== 'ready') {
        store.setReady(getLocalModelPath());
      }
    });
  }, []);

  const handleDownload = async () => {
    try {
      await downloadLocalModel();
    } catch {
      // error stored in store
    }
  };

  const handleDelete = async () => {
    await unloadLocalModel();
    await deleteLocalModel();
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(undefined);
    try {
      const ctx = await loadLocalModel();
      if (!ctx) {
        setTestResult('Failed to load model');
        return;
      }
      let response = '';
      await generateLocal({
        prompt: 'Say hello in one short sentence.',
        onToken: (token) => {
          response += token;
        },
      });
      setTestResult(response.trim() || 'OK');
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  return (
    <SettingsPage
      title="On-device AI"
      footer={
        status === 'ready' ? (
          <AppButton label="Delete model" variant="danger" onPress={() => void handleDelete()} />
        ) : (status as string) === 'downloading' ? null : (
          <AppButton
            label={`Download ${LOCAL_MODEL_NAME}`}
            onPress={() => void handleDownload()}
            loading={status === 'downloading'}
            disabled={status === 'downloading'}
          />
        )
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Run a small AI model directly on this device. No internet, no server, fully
        private. The PC Ollama connection (Settings → Connection) is used as a
        fallback for larger models.
      </Text>

      <AppCard>
        <Text style={[styles.cardTitle, { color: theme.text }]}>Model</Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          {LOCAL_MODEL_NAME} · {formatBytes(LOCAL_MODEL_SIZE_BYTES)}
        </Text>
        <Text style={[styles.cardText, { color: theme.textMuted }]}>
          {status === 'ready'
            ? `Ready · ${path ?? ''}`
            : status === 'downloading'
              ? `Downloading… ${Math.round(progress * 100)}%`
              : status === 'error'
                ? `Error: ${error}`
                : 'Not downloaded'}
        </Text>

        {status === 'downloading' ? (
          <View style={[styles.progressTrack, { backgroundColor: theme.control }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: theme.accentStrong, width: `${Math.round(progress * 100)}%` },
              ]}
            />
          </View>
        ) : null}
      </AppCard>

      {status === 'ready' ? (
        <AppCard>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Test</Text>
          <Text style={[styles.cardText, { color: theme.textMuted }]}>
            Send a quick prompt to the on-device model to verify it works.
          </Text>
          <AppButton
            label="Test model"
            variant="secondary"
            onPress={() => void handleTest()}
            loading={testing}
            disabled={testing}
          />
          {testResult ? (
            <Text style={[styles.cardText, { color: theme.text }]}>{testResult}</Text>
          ) : null}
        </AppCard>
      ) : null}

      {status === 'error' ? (
        <AppButton label="Retry download" variant="secondary" onPress={() => void handleDownload()} />
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
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
});
