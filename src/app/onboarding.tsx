import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { ModelRow } from '@/components/ModelRow';
import { Screen } from '@/components/Screen';
import { useAppTheme } from '@/hooks/useAppTheme';
import { normalizeBaseUrl } from '@/lib/validation';
import { scanForOllama, type DiscoveredServer } from '@/lib/discovery';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

const DEFAULT_BASE_URL = 'http://127.0.0.1:11434';
const DEFAULT_PULL_MODEL = 'qwen2.5:3b';

export default function OnboardingScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const status = useConnectionStore((state) => state.status);
  const latencyMs = useConnectionStore((state) => state.latencyMs);
  const models = useConnectionStore((state) => state.models);
  const error = useConnectionStore((state) => state.error);
  const pulling = useConnectionStore((state) => state.pulling);
  const testConnection = useConnectionStore((state) => state.test);
  const refresh = useConnectionStore((state) => state.refresh);
  const startPull = useConnectionStore((state) => state.startPull);

  const [step, setStep] = useState(0);
  const [baseUrl, setBaseUrl] = useState(settings.baseUrl || DEFAULT_BASE_URL);
  const [inputError, setInputError] = useState<string>();
  const [selectedModel, setSelectedModel] = useState<string>(settings.defaultModel);
  const [scanning, setScanning] = useState(false);
  const [foundServers, setFoundServers] = useState<DiscoveredServer[]>([]);
  const scanAbortRef = useRef<AbortController | null>(null);

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);
  const ready = status === 'online';
  const badgeLabel =
    status === 'online'
      ? `Online · ${latencyMs ?? 0} ms · ${models.length} models`
      : status === 'offline'
        ? 'Offline'
        : status === 'testing'
          ? 'Checking…'
          : 'Not checked';

  useEffect(() => {
    if (step !== 1) return;
    const trimmed = (normalizedBaseUrl ?? DEFAULT_BASE_URL).trim();
    if (!trimmed) return;
    void (async () => {
      await testConnection(trimmed);
      await refresh(trimmed);
    })();
  }, [step, normalizedBaseUrl, testConnection, refresh]);

  useEffect(() => {
    if (step !== 2) return;
    const trimmed = (normalizedBaseUrl ?? settings.baseUrl).trim();
    if (!trimmed) return;
    void refresh(trimmed);
  }, [step, normalizedBaseUrl, refresh, settings.baseUrl]);

  const availableModelNames = models.map((model) => model.name);

  useEffect(() => {
    if (availableModelNames.length === 0) return;
    if (!selectedModel || !availableModelNames.includes(selectedModel)) {
      setSelectedModel(availableModelNames[0]);
    }
  }, [availableModelNames, selectedModel]);

  useEffect(() => {
    return () => {
      scanAbortRef.current?.abort();
    };
  }, []);

  const runTest = async () => {
    const trimmed = (normalizedBaseUrl ?? '').trim();
    if (!trimmed) {
      setInputError('Enter a valid Ollama address starting with http:// or https://.');
      return;
    }

    setInputError(undefined);
    await testConnection(trimmed);
    await refresh(trimmed);
  };

  const pullDefaultModel = async () => {
    const trimmed = (normalizedBaseUrl ?? settings.baseUrl).trim();
    if (!trimmed) return;

    await startPull(trimmed, DEFAULT_PULL_MODEL);
    await refresh(trimmed);
    setSelectedModel(DEFAULT_PULL_MODEL);
  };

  const runScan = async () => {
    scanAbortRef.current?.abort();
    const controller = new AbortController();
    scanAbortRef.current = controller;
    setScanning(true);
    setFoundServers([]);
    try {
      const servers = await scanForOllama((server) => {
        setFoundServers((current) => [...current, server]);
      }, controller.signal);
      setFoundServers(servers);
    } finally {
      setScanning(false);
    }
  };

  const finish = async (modelOverride?: string) => {
    const finalBaseUrl = (normalizedBaseUrl ?? baseUrl.trim()) || settings.baseUrl;
    const finalModel = modelOverride ?? selectedModel ?? settings.defaultModel ?? DEFAULT_PULL_MODEL;

    await update({
      baseUrl: finalBaseUrl,
      defaultModel: finalModel,
      onboardingComplete: true,
    });
    router.replace('/(drawer)');
  };

  return (
    <Screen>
      <View style={styles.bodyContainer}>
        {step === 0 ? (
          <View style={styles.hero}>
            <Text style={[styles.kicker, { color: theme.textMuted }]}>WELCOME</Text>
            <Text style={[styles.title, { color: theme.text }]}>OCBM</Text>
            <Text style={[styles.body, { color: theme.textMuted }]}>
              A calm, private chat app for the AI running on your own machine. No
              accounts, no cloud, no noise.
            </Text>
          </View>
        ) : null}

        {step === 1 ? (
          <View style={styles.content}>
            <Text style={[styles.lead, { color: theme.textMuted }]}>
              Point OCBM at the Ollama server that is running on this machine, then
              confirm it is reachable.
            </Text>

            <AppInput
              label="Base URL"
              value={baseUrl}
              onChangeText={(text) => {
                setBaseUrl(text);
                setInputError(undefined);
              }}
              placeholder="http://127.0.0.1:11434"
              keyboardType="url"
              autoCapitalize="none"
              error={inputError}
              hint="Android emulator: http://10.0.2.2:11434 · phone: http://<LAN-IP>:11434"
              returnKeyType="done"
              onSubmitEditing={() => void runTest()}
            />

            <AppButton label="Test Connection" onPress={() => void runTest()} loading={status === 'testing'} variant="secondary" />

            <AppButton
              label={scanning ? 'Scanning…' : 'Find Ollama on this network'}
              onPress={() => void runScan()}
              loading={scanning}
              variant="ghost"
              disabled={scanning}
            />

            {foundServers.length > 0 ? (
              <View style={styles.foundList}>
                {foundServers.map((server) => (
                  <Pressable
                    key={server.url}
                    onPress={() => {
                      setBaseUrl(server.url);
                      void runTest();
                    }}
                    style={({ pressed }) => [
                      styles.foundRow,
                      { backgroundColor: pressed ? theme.surface : theme.surfaceAlt },
                    ]}
                  >
                    <Text style={[styles.foundUrl, { color: theme.text }]}>{server.url}</Text>
                    <Text style={[styles.foundLatency, { color: theme.textMuted }]}>{`${server.latencyMs} ms`}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}


            {status !== 'unknown' ? (
              <AppCard>
                <ConnectionBadge status={status} label={badgeLabel} />
                {status === 'offline' && error ? (
                  <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text>
                ) : null}
              </AppCard>
            ) : null}
          </View>
        ) : null}

        {step === 2 ? (
          <View style={styles.content}>
            <Text style={[styles.lead, { color: theme.textMuted }]}>
              Choose the default model that answers your chats. You can change it
              later in Settings.
            </Text>

            {models.length === 0 ? (
              <AppCard>
                <Text style={[styles.cardTitle, { color: theme.text }]}>No models yet</Text>
                <Text style={[styles.cardText, { color: theme.textMuted }]}>
                  Pull a small model such as qwen2.5:3b to get started.
                </Text>
                <View style={styles.cardActions}>
                  <AppButton
                    label="Pull qwen2.5:3b"
                    variant="secondary"
                    onPress={() => void pullDefaultModel()}
                    loading={Boolean(pulling)}
                    disabled={Boolean(pulling) || !normalizedBaseUrl}
                  />
                  <AppButton label="Skip for now" variant="ghost" onPress={() => void finish()} />
                </View>
              </AppCard>
            ) : (
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
            )}
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {step === 0 ? (
          <AppButton label="Get started" size="lg" onPress={() => setStep(1)} />
        ) : null}

        {step === 1 ? (
          <>
            <AppButton label="Continue" size="lg" onPress={() => setStep(2)} disabled={!ready} />
            <AppButton label="Skip" variant="ghost" onPress={() => setStep(2)} />
          </>
        ) : null}

        {step === 2 ? (
          <>
            <AppButton label="Back" variant="ghost" onPress={() => setStep(1)} />
            <AppButton label="Finish" size="lg" onPress={() => void finish()} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bodyContainer: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
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
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  lead: {
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    lineHeight: 24,
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.subtitle,
  },
  cardText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
  },
  footer: {
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  foundList: {
    gap: spacing.xs,
  },
  foundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.bubble,
  },
  foundUrl: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
  foundLatency: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
  },
});
