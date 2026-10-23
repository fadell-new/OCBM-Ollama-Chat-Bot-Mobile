import { router, type Href } from 'expo-router';

/**
 * Go back when there is navigation history, otherwise replace the current
 * screen with a sensible parent. This keeps deep links and web reloads from
 * showing React Navigation's unhandled GO_BACK error.
 */
export function goBackOr(fallback: Href): void {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(fallback);
}
