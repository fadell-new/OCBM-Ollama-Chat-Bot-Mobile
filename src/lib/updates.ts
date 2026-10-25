import Constants from 'expo-constants';
import * as Updates from 'expo-updates';

export type UpdateCheckStatus =
  | 'disabled'
  | 'up-to-date'
  | 'available'
  | 'downloaded'
  | 'error';

export type UpdateStatus = {
  status: UpdateCheckStatus;
  message: string;
};

export function areUpdatesSupported(): boolean {
  return Updates.isEnabled;
}

export function getCurrentVersion(): string {
  return Constants.expoConfig?.version ?? '0.0.0';
}

export function getCurrentUpdateId(): string | null {
  return Updates.updateId ?? null;
}

export async function checkForUpdate(): Promise<UpdateStatus> {
  if (!Updates.isEnabled) {
    return {
      status: 'disabled',
      message: 'Updates are unavailable in development or web builds.',
    };
  }

  try {
    const result = await Updates.checkForUpdateAsync();
    const isAvailable = 'isUpdateAvailable' in result ? result.isUpdateAvailable : false;
    if (!isAvailable) {
      return {
        status: 'up-to-date',
        message: 'You are already on the latest version.',
      };
    }

    await Updates.fetchUpdateAsync();
    return {
      status: 'downloaded',
      message: 'An update was downloaded. Restart OCBM to finish.',
    };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Could not check for updates.',
    };
  }
}

export async function restartToUpdate(): Promise<void> {
  if (!Updates.isEnabled) return;
  await Updates.reloadAsync();
}
