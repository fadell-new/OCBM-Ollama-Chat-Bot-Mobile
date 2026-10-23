import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import { ConnectionBadge } from '@/components/ConnectionBadge';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { normalizeBaseUrl } from '@/lib/validation';
import { scanForOllama, type DiscoveredServer } from '@/lib/discovery';
import { useConnectionStore } from '@/store/connectionStore';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export default function ConnectionSettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);
  const status = useConnectionStore((state) => state.status);
  const latencyMs = useConnectionStore((state) => state.latencyMs);
  const models = useConnectionStore((state) => state.models);
  const error = useConnectionStore((state) => state.error);
  const lastCheckedAt = useConnectionStore((state) => state.lastCheckedAt);
  const refresh = useConnectionStore((state) => state.refresh);
  const testConnection = useConnectionStore((state) => state.test);

  const [baseUrl, setBaseUrl] = useState(settings.baseUrl);
  const [inputError, setInputError] = useState<string>();
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [foundServers, setFoundServers] = useState<DiscoveredServer[]>([]);
  const scanAbortRef = useRef<AbortController | null>(null);

  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  useEffect(() => {
    if (!settings.baseUrl) return;
    void (async () => {
      await testConnection(settings.baseUrl);
      await refresh(settings.baseUrl);
    })();
  }, [refresh, settings.baseUrl, testConnection]);

  useEffect(() => {
    return () => {
      scanAbortRef.current?.abort();
    };
  }, []);

  const runTest = async () => {
    const normalized = normalizeBaseUrl(baseUrl);
    if (!normalized) {
      setInputError('Enter a valid Ollama address starting with http:// or https://.');
      return;
    }

    setInputError(undefined);
    setTesting(true);
    await testConnection(normalized);
    await refresh(normalized);
    setTesting(false);
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

  const save = async () => {
    const normalized = normalizeBaseUrl(baseUrl);
    if (!normalized) {
      setInputError('Enter a valid Ollama address starting with http:// or https://.');
      return;
    }

    setSaving(true);
    try {
      await update({ baseUrl: normalized });
      setSaving(false);
      goBackOr('/settings');
    } catch {
      setSaving(false);
      setInputError('Could not save the address. Try again.');
    }
  };

  const badgeLabel =
    status === 'online'
      ? `Online · ${latencyMs ?? 0} ms · ${models.length} models`
      : status === 'offline'
        ? 'Offline'
        : status === 'testing'
          ? 'Checking…'
          : 'Not checked';

  return (
    <SettingsPage
      title="Connection Settings"
      footer={
        <AppButton
          label="Save"
          onPress={() => void save()}
          loading={saving}
          disabled={!normalizedBaseUrl || saving}
        />
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Point OCBM at the Ollama server that is running on this machine. The
        address stays on this device.
      </Text>

      <AppInput
        label="Base URL"
        value={baseUrl}
        onChangeText={(text) => {
          setBaseUrl(text);
          if (inputError) setInputError(undefined);
        }}
        placeholder="http://127.0.0.1:11434"
        keyboardType="url"
        autoCapitalize="none"
        error={inputError}
        hint="Android emulator: http://10.0.2.2:11434 · phone: http://<LAN-IP>:11434"
        returnKeyType="done"
        onSubmitEditing={() => void runTest()}
      />

      <AppButton
        label="Test Connection"
        onPress={() => void runTest()}
        loading={testing}
        variant="secondary"
      />
      <AppButton
        label={scanning ? 'Scanning…' : 'Find Ollama on this network'}
        onPress={() => void runScan()}
        loading={scanning}
        variant="ghost"
        disabled={scanning}
      />

      {foundServers.length > 0 ? (
        <AppCard>
          <Text style={[styles.helpTitle, { color: theme.text }]}>Found servers</Text>
          {foundServers.map((server) => (
            <Pressable
              key={server.url}
              onPress={() => {
                setBaseUrl(server.url);
                void runTest();
              }}
              style={({ pressed }) => [
                styles.foundRow,
                { backgroundColor: pressed ? theme.surface : 'transparent' },
              ]}
            >
              <Text style={[styles.foundUrl, { color: theme.text }]}>{server.url}</Text>
              <Text style={[styles.foundLatency, { color: theme.textMuted }]}>{`${server.latencyMs} ms`}</Text>
            </Pressable>
          ))}
        </AppCard>
      ) : null}


      {lastCheckedAt !== undefined ? (
        <AppCard>
          <View style={styles.resultRow}>
            <ConnectionBadge status={status} label={badgeLabel} />
            {status === 'offline' && error ? (
              <Text style={[styles.resultError, { color: theme.danger }]}>{error}</Text>
            ) : null}
          </View>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Help</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Set OLLAMA_HOST=0.0.0.0 on the host machine to allow other devices. On the
          Android emulator use http://10.0.2.2:11434 instead of 127.0.0.1.
        </Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {`Allow inbound access on port 11434 if the firewall blocks local connections. For a phone on the same network, use http://<LAN-IP>:11434.`}
        </Text>
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
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  foundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
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
  resultError: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
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
});
