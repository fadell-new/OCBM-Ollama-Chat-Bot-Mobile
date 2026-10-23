# SDD ledger — plan: C:\Users\fadel\OneDrive\Desktop\ai2\OCBM\docs\superpowers\plans\2026-10-22-ocbm-ollama-chat.md

Spec: C:\Users\fadel\OneDrive\Desktop\ai2\OCBM\docs\superpowers\specs\2026-10-22-ocbm-ollama-chat-design.md

Pre-flight: no worktree — fresh project, empty target supplied by the user, no existing history. Ruling: work directly in target + git init. Cost if wrong: none (no shared branch).
Pre-flight: Expo SDK 58 template ships `src/app` instead of `app/`. Ruling: use `src/app` + `src/*` (tsconfig `@/*` already maps to `./src/*`). Cost if wrong: plan path references shift by one directory.
Pre-flight: `expo-file-system` 58 new API ships alongside legacy. Ruling: use `expo-file-system/legacy` for copy/read/delete to keep the plan's file operations stable. Cost if wrong: small API migration later.

## Progress

- Task 1: complete (scaffold + tooling; `src/app` template, jest alias mapper via POSIX path helper). Commit 9f3a38a.
- Task 2: complete (types + validation + format; 13 tests passing; tsc clean). Commit below.
- Task 2 → Task 3: `Message`, `OllamaMessage`, `OllamaModel`, `PullProgress` consumed by client tests/impl. Interfaces match plan.
- Task 3: complete (ndjson, context, Ollama client; 20 tests passing; tsc clean). Commit 31c0e6d.
- Task 3 → Task 6/8/11: client constructor injects fetch; `chat` streams NDJSON; `pullModel` progress; `listModels` maps capabilities. Interfaces match.
- Task 4: complete (tokens, typography, ThemeProvider, useAppTheme; 2 theme tests passing). Commit a7aa833.
- Task 5: complete (14 components; 5 component tests passing; tsc clean). RNTL 14 uses async `render`/`fireEvent`; test helper adjusted. `@expo/vector-icons` added. Commit below.
- Task 5 → Task 7/8/9/10/11/12/13: all screens consume `Screen`, `AppButton`, `AppInput`, `SettingsRow`, dialogs, `EmptyState`. APIs match plan.
- Task 6: complete (storage + settings + chats stores; 11 store tests, 51 total passing; tsc clean). Commit 7154633.
- Task 6 → Task 7/8/9/10/11/12/13: stores expose `hydrate`, `createChat`, `openChat`, `appendMessage`, `updateMessage(...,{persist})`, `persistChat`, `clearAllChats`, settings `update`. Interfaces match.
- Task 7: complete (root providers + hydration, redirect, drawer shell, settings/search/onboarding placeholders, `ScreenHeader`, `DrawerContent`; tsc clean; 51 tests passing; web export + Playwright QA at 390×844 passed). Commit below.
- Task 7 ruling: `DrawerContentComponentProps` must come from `expo-router/drawer`, not `@react-navigation/drawer`, because Expo Router 58 vendors its own React Navigation drawer types; the two state types are structurally incompatible.
- Task 7 → Task 8: chat route is `src/app/(drawer)/index.tsx`; Task 8 replaces the placeholder. `DrawerContent` already opens/creates chats and navigates to `/settings` and `/search`.
- Task 8: complete (composeRequest + ChatBubble + Composer + chat screen; 8 new tests, 59 total passing; tsc clean; Playwright QA at 390×844 passed: empty state, online badge, send, streaming, stop, regenerate, persisted-chat reopen, markdown inline code, copy toast, 404 error bubble, dark mode). Commit below.
- Task 8 ruling: `expo/fetch` resolves to `globalThis.fetch` on web, but calling it as an instance property (`this.fetchImpl(...)`) throws `TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation`. Ruling: on web use `globalThis.fetch.bind(globalThis)`; native keeps `expo/fetch` for streaming. Cost if wrong: web QA only; native unaffected.
- Task 8 ruling: `Toast` needed a `bottomOffset` prop; chat passes `banner ? 128 : 80` so the toast clears the composer and offline banner. Default remains 48 for other screens.
- Task 8 ruling: connection status lives in `src/store/connectionStore.ts` (implemented before Task 11) because the chat header badge and offline banner needed it; Task 11 will build the connection/model screens on the same store.
- Task 8 ruling: import fonts and Ionicons from package subpaths (`@expo-google-fonts/inter/400Regular`, `@expo/vector-icons/Ionicons`) so Metro bundles only the five used font weights and one icon font; `jest.setup.js` mocks the Ionicons subpath. Web export assets dropped 63→25 and the shared web chunk 534KB→107KB.
- Task 8 QA note: no vision model is installed on the QA machine, so image attachments remain UI-only until Task 13 and a vision-capable model are available.
- Task 8 → Task 9: `chatsStore` already exposes `renameChat` and `deleteChat`; `DrawerContent` still needs long-press rename/delete, and the search screen remains a placeholder.
- Task 9: complete (`searchChats`/`searchMessages`, real search screen, drawer long-press action sheet; 10 new tests, 69 total passing; tsc clean; web export succeeds with 25 assets). Playwright QA at 390×844 passed: empty state, “pasta” no-match, “ocean” and “hello” results with highlighted snippets and match counts, opening a result, long-press Rename to “Ocean notes”, long-press Delete with confirmation, storage index/key removed, and the chat-preview fallback. Commit below.
- Task 9 ruling: the search screen loads every chat body from AsyncStorage on mount and includes the live `activeChat`; `searchChats` covers summaries, while `searchMessages` scans bodies. Cost: O(number of chats) local reads, acceptable for a local-only app; a persisted full-text index can be added later if needed.
- Task 9 ruling: long-press opens a small modal action sheet (Rename/Delete/Cancel) because a single long-press must expose both actions; `delayLongPress=380` and `onPress` is suppressed for 800 ms after a long press so the chat does not open underneath the sheet.
- Task 9 ruling: `toSummary` now falls back to the last non-empty message, then the last error text, then “Response failed” instead of showing “No messages” for error or empty-streaming chats. Two `chatsStore` tests cover this.
- Task 9 ruling: `AppInput` sets `outlineStyle: 'solid'` and `outlineWidth: 0` to remove Chrome’s black focus ring on web; native inputs are unaffected.
- Task 9 QA note: QA localStorage now contains one chat titled “Ocean notes” (8 messages, last assistant error “Model not found…”), model `qwen2.5:3b`, theme `system`.


