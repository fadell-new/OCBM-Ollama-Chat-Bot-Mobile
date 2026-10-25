import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppCard } from '@/components/AppCard';
import { AppInput } from '@/components/AppInput';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { buildSystemPrompt } from '@/lib/chatSend';
import { goBackOr } from '@/lib/navigation';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

function isValidTimeZone(value: string): boolean {
  if (!value.trim()) return true;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value.trim() });
    return true;
  } catch {
    return false;
  }
}

function formatEffectiveDate(settings: {
  dateTimeMode: 'device' | 'custom';
  dateTimeOverride: string;
  dateTimeTimeZone: string;
}): string {
  const zone = settings.dateTimeTimeZone.trim() || undefined;
  const mode = settings.dateTimeMode ?? 'device';
  const now =
    mode === 'custom' && settings.dateTimeOverride.trim()
      ? new Date(settings.dateTimeOverride.trim())
      : new Date();

  const validNow = Number.isNaN(now.getTime()) ? new Date() : now;

  try {
    return validNow.toLocaleString('en-US', {
      timeZone: zone,
      dateStyle: 'full',
      timeStyle: 'short',
    });
  } catch {
    return validNow.toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'short',
    });
  }
}

export default function DateTimeSettingsScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [mode, setMode] = useState<'device' | 'custom'>(settings.dateTimeMode ?? 'device');
  const [overrideValue, setOverrideValue] = useState(settings.dateTimeOverride);
  const [timeZone, setTimeZone] = useState(settings.dateTimeTimeZone);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const effectiveSettings = useMemo(
    () => ({
      systemPrompt: settings.systemPrompt,
      personalContext: settings.personalContext,
      dateTimeMode: mode,
      dateTimeOverride: overrideValue,
      dateTimeTimeZone: timeZone,
    }),
    [mode, overrideValue, timeZone, settings.personalContext, settings.systemPrompt]
  );

  const preview = buildSystemPrompt(effectiveSettings);

  const save = async () => {
    const trimmedOverride = overrideValue.trim();
    const trimmedTimeZone = timeZone.trim();
    if (mode === 'custom' && trimmedOverride && Number.isNaN(new Date(trimmedOverride).getTime())) {
      setError('Use ISO format, e.g. 2026-11-15T14:30:00');
      return;
    }
    if (!isValidTimeZone(trimmedTimeZone)) {
      setError('Unknown time zone (example: Asia/Bangkok).');
      return;
    }

    setError(undefined);
    setSaving(true);
    try {
      await update({
        dateTimeMode: mode,
        dateTimeOverride: trimmedOverride,
        dateTimeTimeZone: trimmedTimeZone,
      });
      goBackOr('/settings');
    } catch {
      setError('Could not save date/time settings.');
    } finally {
      setSaving(false);
    }
  };

  const resetToDeviceTime = () => {
    setMode('device');
    setOverrideValue('');
    setTimeZone('');
    setError(undefined);
  };

  const currentPreview = formatEffectiveDate({
    dateTimeMode: mode,
    dateTimeOverride: overrideValue,
    dateTimeTimeZone: timeZone,
  });

  return (
    <SettingsPage
      title="Date & Time"
      footer={
        <>
          <AppButton label="Save" onPress={() => void save()} loading={saving} />
          <AppButton
            label="Reset to device time"
            variant="ghost"
            onPress={resetToDeviceTime}
            disabled={saving}
          />
        </>
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        These settings change the date/time reference that OCBM sends to your AI
        models. They do not change your phone's system clock.
      </Text>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>Mode</Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          Device time uses the clock on this phone. Custom mode lets you force a
          specific date/time for testing or for a fixed environment.
        </Text>

        <View style={styles.modeRow}>
          {[
            { value: 'device', label: 'Device time' },
            { value: 'custom', label: 'Custom time' },
          ].map((option) => {
            const active = mode === option.value;
            return (
              <AppButton
                key={option.value}
                label={option.label}
                variant={active ? 'primary' : 'secondary'}
                onPress={() => setMode(option.value as 'device' | 'custom')}
                disabled={saving}
              />
            );
          })}
        </View>
      </AppCard>

      {mode === 'custom' ? (
        <AppCard>
          <AppInput
            label="Custom date & time"
            value={overrideValue}
            onChangeText={(text) => {
              setOverrideValue(text);
              if (error) setError(undefined);
            }}
            placeholder="2026-11-15T14:30:00"
            autoCapitalize="none"
            keyboardType="default"
            hint="ISO format, e.g. 2026-11-15T14:30:00"
          />
          <AppInput
            label="Time zone (optional)"
            value={timeZone}
            onChangeText={(text) => {
              setTimeZone(text);
              if (error) setError(undefined);
            }}
            placeholder="Asia/Bangkok"
            autoCapitalize="none"
            hint="Leave empty to use the device time zone."
          />
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>
          Effective date/time sent to AI
        </Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {currentPreview}
        </Text>
      </AppCard>

      <AppCard>
        <Text style={[styles.helpTitle, { color: theme.text }]}>
          Prompt preview
        </Text>
        <Text style={[styles.helpText, { color: theme.textMuted }]}>
          {preview}
        </Text>
      </AppCard>

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
  modeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  helpTitle: {
    fontFamily: fonts.medium,
    fontSize: typeScale.subtitle,
    marginBottom: spacing.xs,
  },
  helpText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
  error: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
});
