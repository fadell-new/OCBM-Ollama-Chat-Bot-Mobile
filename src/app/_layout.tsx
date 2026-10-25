import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Alert } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useChatsStore } from '@/store/chatsStore';
import { useSettingsStore } from '@/store/settingsStore';
import { checkForUpdate, restartToUpdate } from '@/lib/updates';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { fonts, type as typeScale } from '@/theme/typography';

function AppShell() {
  const { theme } = useAppTheme();
  const settingsHydrated = useSettingsStore((state) => state.hydrated);
  const chatsHydrated = useChatsStore((state) => state.hydrated);

  if (!settingsHydrated || !chatsHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.bg }]}>
        <Text style={[styles.brand, { color: theme.text }]}>OCBM</Text>
        <ActivityIndicator color={theme.accentStrong} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function RootLayout() {
  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateChats = useChatsStore((state) => state.hydrate);
  const themeMode = useSettingsStore((state) => state.settings.theme);
  const updateSettings = useSettingsStore((state) => state.update);
  const settingsHydrated = useSettingsStore((state) => state.hydrated);
  const chatsHydrated = useChatsStore((state) => state.hydrated);

  useEffect(() => {
    void hydrateSettings();
    void hydrateChats();
  }, [hydrateSettings, hydrateChats]);

  const hasCheckedUpdatesRef = useRef(false);
  useEffect(() => {
    if (!settingsHydrated || !chatsHydrated || hasCheckedUpdatesRef.current) return;
    hasCheckedUpdatesRef.current = true;

    void (async () => {
      const result = await checkForUpdate();
      if (result.status !== 'downloaded') return;

      Alert.alert(
        'Update available',
        result.message,
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart now', onPress: () => void restartToUpdate() },
        ]
      );
    })();
  }, [settingsHydrated, chatsHydrated]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ThemeProvider
            mode={themeMode}
            onModeChange={(mode) => {
              void updateSettings({ theme: mode });
            }}
          >
            <StatusBar style="auto" />
            <AppShell />
          </ThemeProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  brand: {
    fontFamily: fonts.heading,
    fontSize: typeScale.display,
  },
});
