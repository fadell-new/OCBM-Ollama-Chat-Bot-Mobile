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

export default function ProfileScreen() {
  const { theme } = useAppTheme();
  const settings = useSettingsStore((state) => state.settings);
  const update = useSettingsStore((state) => state.update);

  const [name, setName] = useState(settings.profile.name);
  const [email, setEmail] = useState(settings.profile.email);
  const [phone, setPhone] = useState(settings.profile.phone);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError('Enter your name.');
      return;
    }

    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError('Enter a valid email address.');
      return;
    }

    setError(undefined);
    setSaving(true);

    try {
      await update({
        profile: { name: trimmedName, email: trimmedEmail, phone: trimmedPhone },
      });
      goBackOr('/settings');
    } catch {
      setError('Could not save your profile. Try again.');
      setSaving(false);
    }
  };

  return (
    <SettingsPage
      title="Profile"
      footer={<AppButton label="Save" onPress={() => void save()} loading={saving} />}
    >
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        This profile stays on this device and is never uploaded anywhere.
      </Text>

      <AppInput
        label="Name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (error) setError(undefined);
        }}
        placeholder="Your name"
        returnKeyType="next"
      />

      <AppInput
        label="Email"
        value={email}
        onChangeText={(value) => {
          setEmail(value);
          if (error) setError(undefined);
        }}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        returnKeyType="next"
      />

      <AppInput
        label="Phone"
        value={phone}
        onChangeText={(value) => {
          setPhone(value);
          if (error) setError(undefined);
        }}
        placeholder="+66 81 234 5678"
        keyboardType="phone-pad"
        returnKeyType="done"
      />

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}
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
  error: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 18,
    marginTop: spacing.sm,
  },
});
