# Architecture

## Folder structure

```
src/
  app/          Expo Router routes (file-based)
  components/   Reusable UI
  lib/          Pure utilities and helpers
  store/        Zustand stores
  api/          Ollama HTTP client
  hooks/        React hooks (theme)
  theme/        Tokens, typography, colors
  types/        Shared TypeScript types
```

## Data flow

```
Screen → Store (Zustand) → OllamaClient → Ollama HTTP API
                ↓
         AsyncStorage (persistence)
```

- Screens read from stores via selectors.
- Stores own persistence (AsyncStorage) and side effects.
- `OllamaClient` wraps `fetch` (expo/fetch on native, bound global fetch on web) and parses NDJSON streams.

## Persistence keys

All keys are namespaced under `ocbm:`:

| Key | Content |
| --- | --- |
| `ocbm:settings` | `Settings` (baseUrl, defaultModel, theme, prompts, profile, onboardingComplete) |
| `ocbm:chats` | `Chat[]` |

## Streaming sequence

1. `handleSend` appends a `user` message, then an empty `assistant` (streaming) message.
2. `runCompletion` calls `composeRequest` → `buildContextMessages` (system prompt + last 24 messages / 24k chars).
3. `OllamaClient.chat` POSTs `/api/chat` with `stream: true` and reads NDJSON, calling `onToken` per chunk.
4. Tokens are appended to the assistant message via `updateMessage`.
5. On completion, status flips to `done`; on error, `error` is stored and status becomes `error`.

## Error handling

- Network / timeout / abort errors are mapped to `OllamaError` with a stable `code`.
- The chat screen surfaces errors inline on the assistant bubble and via toast.
- Connection status (`unknown/testing/online/offline`) drives the badge and gating of Continue.

## Attachment storage

- Validated attachments are copied into `FileSystem.documentDirectory/attachments/`.
- Images are read as base64 only at send time (`toOllamaImages`).
- Text files are read as UTF-8 (capped at 100 KB) and appended to the message content as a block.
- The `Message` carries `attachments` (metadata) and `images` (base64) for the current turn.

## Context budget

- System prompt + Personal Intelligence notes first.
- Then the newest messages up to 24 messages / ~24,000 characters.
- If the newest message alone exceeds the budget it is truncated rather than dropped.
