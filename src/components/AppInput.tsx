import { forwardRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { useAppTheme } from '@/hooks/useAppTheme';
import { fonts, radii, spacing, type as typeScale } from '@/theme/typography';

export type AppInputProps = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  editable?: boolean;
  maxLength?: number;
  rightElement?: ReactNode;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  onBlur?: TextInputProps['onBlur'];
  onFocus?: TextInputProps['onFocus'];
  onSubmitEditing?: TextInputProps['onSubmitEditing'];
  returnKeyType?: TextInputProps['returnKeyType'];
  testID?: string;
};

export const AppInput = forwardRef<ComponentRef<typeof TextInput>, AppInputProps>(function AppInput(
  {
    label,
    value,
    onChangeText,
    placeholder,
    error,
    hint,
    multiline = false,
    keyboardType,
    autoCapitalize = 'sentences',
    secureTextEntry,
    autoFocus,
    editable = true,
    maxLength,
    rightElement,
    style,
    inputStyle,
    onBlur,
    onFocus,
    onSubmitEditing,
    returnKeyType,
    testID,
  },
  ref
) {
  const { theme } = useAppTheme();
  const [focused, setFocused] = useState(false);

  const borderColor = error ? theme.danger : focused ? theme.accentStrong : theme.border;

  return (
    <View style={style}>
      {label ? (
        <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      ) : null}

      <View
        style={[
          styles.field,
          multiline ? styles.multilineField : styles.singleLineField,
          {
            backgroundColor: theme.control,
            borderColor,
            opacity: editable ? 1 : 0.55,
          },
        ]}
      >
        <TextInput
          ref={ref}
          testID={testID}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textMuted}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          secureTextEntry={secureTextEntry}
          autoFocus={autoFocus}
          editable={editable}
          maxLength={maxLength}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          onSubmitEditing={onSubmitEditing}
          returnKeyType={returnKeyType}
          style={[
            styles.input,
            { color: theme.text },
            multiline && styles.multilineInput,
            inputStyle,
          ]}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>

      {error ? (
        <Text style={[styles.helper, { color: theme.danger }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.helper, { color: theme.textMuted }]}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  label: {
    fontFamily: fonts.medium,
    fontSize: typeScale.caption,
    marginBottom: spacing.xs + 2,
    marginLeft: spacing.xs,
    letterSpacing: 0.3,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
  },
  singleLineField: {
    minHeight: 52,
    borderRadius: radii.pill,
  },
  multilineField: {
    minHeight: 120,
    borderRadius: radii.card,
    paddingVertical: spacing.sm,
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: typeScale.body,
    paddingVertical: spacing.md,
  },
  multilineInput: {
    minHeight: 96,
    paddingTop: spacing.sm,
  },
  right: {
    marginLeft: spacing.sm,
  },
  helper: {
    fontFamily: fonts.body,
    fontSize: typeScale.caption,
    marginTop: spacing.xs + 2,
    marginLeft: spacing.xs,
  },
});
