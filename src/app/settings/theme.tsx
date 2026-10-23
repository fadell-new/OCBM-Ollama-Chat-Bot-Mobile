import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SettingsPage } from '@/components/SettingsPage';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useSettingsStore } from '@/store/settingsStore';
import { themes, type Theme } from '@/theme/tokens';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';
import type { ThemeMode } from '@/types';

type ThemeOption = {
  mode: ThemeMode;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  preview: Theme;
};

export default function ThemeScreen() {
  const { theme, isDark } = useAppTheme();
  const themeMode = useSettingsStore((state) => state.settings.theme);
  const update = useSettingsStore((state) => state.update);

  const options: ThemeOption[] = [
    {
      mode: 'light',
      label: 'Light',
      description: 'Bright surfaces, dark text.',
      icon: 'sunny-outline',
      preview: themes.light,
    },
    {
      mode: 'dark',
      label: 'Dark',
      description: 'Dim surfaces, light text.',
      icon: 'moon-outline',
      preview: themes.dark,
    },
    {
      mode: 'system',
      label: 'System',
      description: `Follow your device · currently ${isDark ? 'Dark' : 'Light'}`,
      icon: 'phone-portrait-outline',
      preview: theme,
    },
  ];

  const selected = options.find((option) => option.mode === themeMode) ?? options[2];
  const preview = selected.preview;

  return (
    <SettingsPage title="Theme">
      <Text style={[styles.lead, { color: theme.textMuted }]}>
        Choose how OCBM looks. Changes apply right away and are saved
        automatically.
      </Text>

      <View style={styles.options}>
        {options.map((option) => {
          const isSelected = option.mode === themeMode;

          return (
            <Pressable
              key={option.mode}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              aria-checked={isSelected}
              accessibilityLabel={`${option.label} theme`}
              onPress={() => void update({ theme: option.mode })}
              style={({ pressed }) => [
                styles.option,
                {
                  backgroundColor: isSelected ? theme.accent : theme.surfaceAlt,
                  borderColor: isSelected ? theme.accentStrong : theme.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: isSelected ? theme.bg : theme.surface },
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={isSelected ? theme.text : theme.textMuted}
                />
              </View>

              <View style={styles.optionBody}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  {option.label}
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textMuted }]}>
                  {option.description}
                </Text>
              </View>

              {isSelected ? (
                <Ionicons name="checkmark-circle" size={22} color={theme.accentStrong} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.previewSection}>
        <Text style={[styles.previewLabel, { color: theme.textMuted }]}>PREVIEW</Text>

        <View
          style={[
            styles.preview,
            { backgroundColor: preview.bg, borderColor: preview.border },
          ]}
        >
          <View style={styles.previewHeader}>
            <Text style={[styles.previewBrand, { color: preview.text }]}>OCBM</Text>
            <View style={[styles.previewDot, { backgroundColor: preview.success }]} />
          </View>

          <View style={[styles.assistantBubble, { backgroundColor: preview.surface }]}>
            <Text style={[styles.bubbleText, { color: preview.text }]}>
              Of course. Here’s the short version.
            </Text>
          </View>

          <View style={[styles.userBubble, { backgroundColor: preview.accent }]}>
            <Text style={[styles.bubbleText, { color: preview.onAccent }]}>
              Explain it simply.
            </Text>
          </View>

          <View style={[styles.composer, { backgroundColor: preview.control }]}>
            <Text style={[styles.composerText, { color: preview.textMuted }]}>
              Write anything…
            </Text>
          </View>
        </View>
      </View>
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
  options: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1.5,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontFamily: fonts.medium,
    fontSize: typeScale.body,
  },
  optionDescription: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 19,
  },
  previewSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  previewLabel: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    letterSpacing: 1,
  },
  preview: {
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewBrand: {
    fontFamily: fonts.heading,
    fontSize: 20,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  assistantBubble: {
    maxWidth: '82%',
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  userBubble: {
    maxWidth: '82%',
    alignSelf: 'flex-end',
    borderRadius: 16,
    borderBottomRightRadius: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
    lineHeight: 20,
  },
  composer: {
    minHeight: 40,
    borderRadius: radii.pill,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  composerText: {
    fontFamily: fonts.body,
    fontSize: typeScale.label,
  },
});
