import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { isValidEmail } from '@/lib/validation';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function EmailScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [value, setValue] = useState(settings.profile.email);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const email = value.trim();
    if (!isValidEmail(email)) {
      setError('Enter a valid email address.');
      return;
    }

    setError(undefined);
    setSaving(true);

    try {
      await update({ profile: { ...settings.profile, email } });
      goBackOr('/settings');
    } catch {
      setError('Could not save this email. Try again.');
      setSaving(false);
    }
  };

  const remove = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ profile: { ...settings.profile, email: '' } });
      goBackOr('/settings');
    } catch {
      setError('Could not remove this email. Try again.');
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title="Add Email"
      footer={
        <>
          <AppButton label="Add" onPress={() => void save()} loading={saving} />
          {settings.profile.email ? (
            <AppButton
              label="Remove email"
              variant="ghost"
              onPress={() => void remove()}
              disabled={saving}
            />
          ) : null}
        </>
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Add an email to your local profile. It is stored on this device and is
        never sent anywhere.
      </Text>

      <AppInput
        label="Email address"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) setError(undefined);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoFocus
        error={error}
        hint="Stored only on this device."
        returnKeyType="done"
        onSubmitEditing={() => void save()}
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
});
