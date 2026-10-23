import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppInput } from '@/components/AppInput';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { ScreenHeader } from '@/components/ScreenHeader';
import { spacing } from '@/theme/typography';

export default function SearchScreen() {
  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <ScreenHeader title="Search" onBack={() => router.back()} />
      </View>

      <View style={styles.body}>
        <AppInput
          value=""
          onChangeText={() => {}}
          placeholder="Search chats"
          autoCapitalize="none"
        />
        <EmptyState
          title="Search your chats"
          description="Find a past conversation by its title or by something you remember saying."
          icon="search-outline"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.xl,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
});
