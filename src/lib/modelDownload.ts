import * as FileSystem from 'expo-file-system/legacy';

import { getModelById, type DeviceModel } from '@/lib/modelCatalog';
import { useLocalModelStore } from '@/store/localModelStore';

const MODELS_DIR = `${FileSystem.documentDirectory}models/`;

const inFlight = new Map<string, FileSystem.DownloadResumable>();
const cancelled = new Set<string>();

export function getModelPath(model: DeviceModel): string {
  return `${MODELS_DIR}${model.fileName}`;
}

async function ensureModelsDir(): Promise<string> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
  return MODELS_DIR;
}

export async function getFreeStorageAsync(): Promise<number> {
  return FileSystem.getFreeDiskStorageAsync();
}

export async function isModelDownloaded(modelId: string): Promise<boolean> {
  const model = getModelById(modelId);
  if (!model) return false;
  const info = await FileSystem.getInfoAsync(getModelPath(model));
  return info.exists && (info.size ?? 0) > 0;
}

export async function downloadModel(
  modelId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const model = getModelById(modelId);
  if (!model) throw new Error('Unknown model');

  if (inFlight.has(modelId)) {
    return getModelPath(model);
  }

  await ensureModelsDir();
  const destination = getModelPath(model);
  const store = useLocalModelStore.getState();

  store.startDownload(modelId);
  store.setLastError(null);
  cancelled.delete(modelId);

  const resumable = FileSystem.createDownloadResumable(
    model.url,
    destination,
    {},
    (progress) => {
      const ratio =
        progress.totalBytesExpectedToWrite > 0
          ? progress.totalBytesWritten / progress.totalBytesExpectedToWrite
          : 0;
      useLocalModelStore.getState().setProgress(modelId, ratio);
      onProgress?.(ratio);
    }
  );

  inFlight.set(modelId, resumable);

  try {
    const result = await resumable.downloadAsync();
    if (!result?.uri) {
      throw new Error('Download cancelled');
    }
    useLocalModelStore.getState().setInstalled(modelId, result.uri);
    return result.uri;
  } catch (error) {
    if (cancelled.has(modelId)) {
      cancelled.delete(modelId);
      useLocalModelStore.getState().clearDownload(modelId);
      await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
      throw new Error('Download cancelled');
    }

    const message = error instanceof Error ? error.message : 'Download failed';
    useLocalModelStore.getState().setDownloadError(modelId, message);
    await FileSystem.deleteAsync(destination, { idempotent: true }).catch(() => undefined);
    throw error;
  } finally {
    inFlight.delete(modelId);
  }
}

export async function cancelDownload(modelId: string): Promise<void> {
  const resumable = inFlight.get(modelId);
  if (!resumable) return;

  cancelled.add(modelId);

  try {
    await resumable.cancelAsync();
  } catch {
    // ignore
  }

  inFlight.delete(modelId);

  const model = getModelById(modelId);
  if (model) {
    await FileSystem.deleteAsync(getModelPath(model), { idempotent: true }).catch(
      () => undefined
    );
  }

  useLocalModelStore.getState().clearDownload(modelId);
}

export async function deleteModel(modelId: string): Promise<void> {
  const model = getModelById(modelId);
  if (model) {
    await FileSystem.deleteAsync(getModelPath(model), { idempotent: true }).catch(
      () => undefined
    );
  }
  useLocalModelStore.getState().removeInstalled(modelId);
}

/**
 * Drops records whose files no longer exist (for example, after the OS clears
 * app storage) and repairs the active model selection.
 */
export async function reconcileInstalledModels(): Promise<void> {
  const state = useLocalModelStore.getState();

  for (const [id, record] of Object.entries(state.installed)) {
    const info = await FileSystem.getInfoAsync(record.path);
    if (!info.exists) {
      state.removeInstalled(id);
    }
  }

  const after = useLocalModelStore.getState();
  if (after.activeModelId && !after.installed[after.activeModelId]) {
    const firstInstalled = Object.keys(after.installed)[0] ?? null;
    after.setActive(firstInstalled);
  }
}
