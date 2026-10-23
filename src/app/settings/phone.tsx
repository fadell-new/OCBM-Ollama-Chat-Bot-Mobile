import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { goBackOr } from '@/lib/navigation';
import { isValidPhone } from '@/lib/validation';
import { useSettingsStore } from '@/store/settingsStore';
import { fonts, spacing, type as typeScale } from '@/theme/typography';

export default function PhoneScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [value, setValue] = useState(settings.profile.phone);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const phone = value.trim();
    if (!isValidPhone(phone)) {
      setError('Enter a valid phone number.');
      return;
    }

    setError(undefined);
    setSaving(true);

    try {
      await update({ profile: { ...settings.profile, phone } });
      goBackOr('/settings');
    } catch {
      setError('Could not save this phone number. Try again.');
      setSaving(false);
    }
  };

  const remove = async () => {
    setError(undefined);
    setSaving(true);

    try {
      await update({ profile: { ...settings.profile, phone: '' } });
      goBackOr('/settings');
    } catch {
      setError('Could not remove this phone number. Try again.');
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title="Add Phone"
      footer={
        <>
          <AppButton label="Add" onPress={() => void save()} loading={saving} />
          {settings.profile.phone ? (
            <AppButton
              label="Remove phone number"
              variant="ghost"
              onPress={() => void remove()}
              disabled={saving}
            />
          ) : null}
        </>
      }
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Add a phone number to your local profile. It is stored on this device and
        is never sent anywhere.
      </Text>

      <AppInput
        label="Phone number"
        value={value}
        onChangeText={(text) => {
          setValue(text);
          if (error) setError(undefined);
        }}
        placeholder="+66 81 234 5678"
        keyboardType="phone-pad"
        autoFocus
        error={error}
        hint="9–15 digits. +, spaces, and dashes are allowed."
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
