import * as FileSystem from 'expo-file-system/legacy';

import {
  LOCAL_MODEL_URL,
  LOCAL_MODEL_NAME,
  useLocalModelStore,
} from '@/store/localModelStore';

const MODELS_DIR = `${FileSystem.documentDirectory}models/`;

async function ensureModelsDir(): Promise<string> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
  return MODELS_DIR;
}

export function getLocalModelPath(): string {
  return `${MODELS_DIR}${LOCAL_MODEL_NAME.replace(/[^a-zA-Z0-9._-]/g, '_')}.gguf`;
}

export async function isLocalModelDownloaded(): Promise<boolean> {
  const path = getLocalModelPath();
  const info = await FileSystem.getInfoAsync(path);
  return info.exists && (info.size ?? 0) > 0;
}

export async function downloadLocalModel(
  onProgress?: (progress: number) => void
): Promise<string> {
  await ensureModelsDir();
  const destination = getLocalModelPath();
  const store = useLocalModelStore.getState();

  store.setDownloading(0);

  const downloadResumable = FileSystem.createDownloadResumable(
    LOCAL_MODEL_URL,
    destination,
    {},
    (downloadProgress) => {
      const progress =
        downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
          : 0;
      useLocalModelStore.getState().setDownloading(progress);
      onProgress?.(progress);
    }
  );

  try {
    const result = await downloadResumable.downloadAsync();
    if (!result || !result.uri) {
      throw new Error('Download failed');
    }
    useLocalModelStore.getState().setReady(result.uri);
    return result.uri;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Download failed';
    useLocalModelStore.getState().setError(message);
    throw error;
  }
}

export async function deleteLocalModel(): Promise<void> {
  const path = getLocalModelPath();
  const info = await FileSystem.getInfoAsync(path);
  if (info.exists) {
    await FileSystem.deleteAsync(path, { idempotent: true });
  }
  useLocalModelStore.getState().reset();
}
