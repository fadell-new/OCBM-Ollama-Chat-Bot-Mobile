import { Redirect } from 'expo-router';

import { useSettingsStore } from '@/store/settingsStore';

export default function Index() {
  const onboardingComplete = useSettingsStore(
    (state) => state.settings.onboardingComplete
  );

  return <Redirect href={onboardingComplete ? '/(drawer)' : '/onboarding'} />;
}
