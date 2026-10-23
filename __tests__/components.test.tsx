import { fireEvent, render } from '@testing-library/react-native';

import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { SettingsRow } from '@/components/SettingsRow';

describe('AppButton', () => {
  test('calls onPress when enabled', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(<AppButton label="Save" onPress={onPress} />);

    await fireEvent.press(getByText('Save'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('exposes a disabled state', async () => {
    const { getByTestId } = await render(
      <AppButton label="Save" onPress={() => {}} disabled testID="save" />
    );
    expect(getByTestId('save').props.accessibilityState).toEqual({
      disabled: true,
      busy: false,
    });
  });

  test('exposes a busy state while loading', async () => {
    const { getByTestId } = await render(
      <AppButton label="Save" onPress={() => {}} loading testID="save" />
    );
    expect(getByTestId('save').props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    });
  });
});

describe('AppInput', () => {
  test('shows label, value, and error', async () => {
    const { getByText, getByDisplayValue } = await render(
      <AppInput label="Email" value="a@b.com" onChangeText={() => {}} error="Invalid email" />
    );
    expect(getByText('Email')).toBeTruthy();
    expect(getByDisplayValue('a@b.com')).toBeTruthy();
    expect(getByText('Invalid email')).toBeTruthy();
  });
});

describe('SettingsRow', () => {
  test('fires onPress and shows the current value', async () => {
    const onPress = jest.fn();
    const { getByText } = await render(
      <SettingsRow label="Theme" value="Light" onPress={onPress} />
    );
    await fireEvent.press(getByText('Theme'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(getByText('Light')).toBeTruthy();
  });
});
