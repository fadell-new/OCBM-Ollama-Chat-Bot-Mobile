import { storage } from '@/lib/storage';
import { useChatsStore } from '@/store/chatsStore';
import { useSettingsStore } from '@/store/settingsStore';

/**
 * Remove every OCBM key from device storage and reset the in-memory stores.
 * Attachment files live outside AsyncStorage; Task 13 extends this helper to
 * delete those files as well.
 */
export async function resetApp(): Promise<void> {
  await storage.clearAll();
  await Promise.all([
    useSettingsStore.getState().reset(),
    useChatsStore.getState().clearAllChats(),
  ]);
}
