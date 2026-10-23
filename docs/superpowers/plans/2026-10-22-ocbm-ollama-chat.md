# OCBM — Ollama Mobile Chat App — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างแอป Android-first (cross-platform) ที่แชทกับ Ollama ได้จริง โดยใช้ UI จาก Figma และสไตล์เดียวกันในส่วนที่ Figma ยังไม่มี

**Architecture:** Expo + React Native + TypeScript, Expo Router (Drawer + Stack), Zustand stores, AsyncStorage + app documents สำหรับ persistence, Ollama REST/NDJSON streaming ผ่าน `expo/fetch`

**Tech Stack:** Expo SDK 58, React Native, TypeScript strict, Expo Router, Zustand, AsyncStorage, expo/fetch, expo-image-picker, expo-document-picker, expo-file-system, expo-font, @expo-google-fonts/inknut-antiqua, @expo-google-fonts/inter, react-native-markdown-display, Jest + jest-expo + @testing-library/react-native

**Spec:** `docs/superpowers/specs/2026-10-22-ocbm-ollama-chat-design.md`

## Global Constraints

- ภาษา UI: **อังกฤษ** ตาม Figma; เอกสาร `.md` เป็นไทย
- แอปชื่อ **OCBM**; Android package `com.ocbm.app`; scheme `ocbm`
- Base URL default **ว่าง**; onboarding บังคับกรอก
- Android `usesCleartextTraffic: true`
- เก็บไฟล์แนบใน app documents dir; AsyncStorage เก็บเฉพาะ metadata
- Chat context ส่งสูงสุด **24 ข้อความล่าสุด** และ **~24,000 ตัวอักษร**; system prompt ส่งเสมอ
- Image limits: **4 รูป**, **10MB/รูป**; text file **100KB**
- ทุก task ต้องผ่าน `npx tsc --noEmit`
- ห้าม hardcode สีใน component — ใช้ theme tokens เท่านั้น
- Touch target ≥ 44×44
- ไม่มี backend, ไม่มี auth จริง

## Review Focus

1. **Ollama unreachable / URL ผิด** — onboarding, chat, connection ต้องแสดง error + retry ไม่ crash (test ใน Task 3, 11)
2. **NDJSON ถูกตัดกลางบรรทัด** — ต้อง buffer ส่วนที่เหลือและ parse ได้ (test ใน Task 3)
3. **แชทยาวเกิน context** — ต้อง trim ข้อความเก่าแต่เก็บ system prompt (test ใน Task 3)
4. **App ปิดกลาง stream** — chat ต้องไม่ corrupted; message ที่ค้าง `streaming` ต้องกลายเป็น `error` ตอน hydrate (test ใน Task 6)
5. **Email/phone/URL ผิด + ไฟล์ใหญ่เกิน** — ต้อง block พร้อมข้อความชัดเจน (test ใน Task 2, 13)
6. **Dark mode contrast** — ทุก surface/text ต้องใช้ token และอ่านได้ (visual QA Task 14)

---

## Task 1: Scaffold Expo + tooling + app config

**Files:**
- Create: `package.json`, `app.json`, `tsconfig.json`, `jest.config.js`, `.gitignore`, `babel.config.js` (ถ้า template มีอยู่แล้วให้แก้)
- Create: `app/_layout.tsx` (placeholder)
- Modify: `docs/` คงไว้

**Interfaces:**
- Produces: โปรเจกต์ Expo ที่รัน `npx expo start` ได้, path alias `@/*` → `src/*`

- [ ] **Step 1: Scaffold ใน temp แล้ว copy เข้า target (target มี docs/ อยู่แล้ว)**

```powershell
$tmp = "C:\Users\fadel\AppData\Local\Temp\opencode\ocbm-scaffold"
if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
npx create-expo-app@latest $tmp --template default --no-install
Get-ChildItem -Force $tmp | Copy-Item -Destination "C:\Users\fadel\OneDrive\Desktop\ai2\OCBM" -Recurse -Force
```

- [ ] **Step 2: ติดตั้ง dependencies**

```powershell
cd C:\Users\fadel\OneDrive\Desktop\ai2\OCBM
npm install
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar react-native-gesture-handler react-native-reanimated @react-navigation/drawer @react-native-async-storage/async-storage expo-image-picker expo-document-picker expo-file-system expo-clipboard expo-haptics expo-font expo-splash-screen
npm install zustand @expo-google-fonts/inknut-antiqua @expo-google-fonts/inter react-native-markdown-display
npm install -D jest jest-expo @testing-library/react-native @types/jest
```

- [ ] **Step 3: ตั้งค่า `app.json`**

```json
{
  "expo": {
    "name": "OCBM",
    "slug": "ocbm",
    "scheme": "ocbm",
    "version": "1.0.0",
    "orientation": "portrait",
    "userInterfaceStyle": "automatic",
    "newArchEnabled": true,
    "android": {
      "package": "com.ocbm.app",
      "usesCleartextTraffic": true,
      "adaptiveIcon": { "backgroundColor": "#EBEBEB" }
    },
    "plugins": ["expo-router", "expo-font", "expo-image-picker", "expo-document-picker"],
    "experiments": { "typedRoutes": true }
  }
}
```

- [ ] **Step 4: ตั้งค่า `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

- [ ] **Step 5: ตั้งค่า Jest (`jest.config.js`)**

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|@react-navigation/.*|zustand))'
  ],
};
```

สร้าง `jest.setup.js`:

```js
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
```

- [ ] **Step 6: ยืนยันว่า scaffold ผ่าน**

Run: `npx tsc --noEmit`
Expected: PASS (ไม่มี error)

- [ ] **Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: scaffold Expo project with tooling"
```

---

## Task 2: Types + validation + formatting utilities

**Files:**
- Create: `src/types/index.ts`, `src/lib/validation.ts`, `src/lib/format.ts`
- Test: `__tests__/validation.test.ts`, `__tests__/format.test.ts`

**Interfaces:**
- Produces:
  - `isValidEmail(value: string): boolean`
  - `isValidPhone(value: string): boolean`
  - `normalizeBaseUrl(value: string): string | null`
  - `formatBytes(bytes: number): string`
  - `formatRelativeTime(timestamp: number, now?: number): string`
  - `makeChatTitle(text: string, maxLength?: number): string`
  - types: `Role`, `Attachment`, `Message`, `Chat`, `ChatSummary`, `Profile`, `Settings`, `OllamaModel`, `ThemeMode`

- [ ] **Step 1: เขียน failing tests**

```ts
// __tests__/validation.test.ts
import { isValidEmail, isValidPhone, normalizeBaseUrl } from '@/lib/validation';

test('email validation', () => {
  expect(isValidEmail('a@b.com')).toBe(true);
  expect(isValidEmail('a@b')).toBe(false);
  expect(isValidEmail('')).toBe(false);
});

test('phone validation accepts +, spaces, dashes', () => {
  expect(isValidPhone('0812345678')).toBe(true);
  expect(isValidPhone('+66 81-234-5678')).toBe(true);
  expect(isValidPhone('abc')).toBe(false);
});

test('base url normalization', () => {
  expect(normalizeBaseUrl('http://192.168.1.10:11434/')).toBe('http://192.168.1.10:11434');
  expect(normalizeBaseUrl('  https://host:11434  ')).toBe('https://host:11434');
  expect(normalizeBaseUrl('192.168.1.10:11434')).toBeNull();
  expect(normalizeBaseUrl('')).toBeNull();
});
```

```ts
// __tests__/format.test.ts
import { formatBytes, formatRelativeTime, makeChatTitle } from '@/lib/format';

test('formatBytes', () => {
  expect(formatBytes(1024)).toBe('1.0 KB');
  expect(formatBytes(1536)).toBe('1.5 KB');
  expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
});

test('relative time', () => {
  const now = 1_700_000_000_000;
  expect(formatRelativeTime(now - 30_000, now)).toBe('now');
  expect(formatRelativeTime(now - 5 * 60_000, now)).toBe('5m');
  expect(formatRelativeTime(now - 3 * 3_600_000, now)).toBe('3h');
});

test('chat title', () => {
  expect(makeChatTitle('  hello   world  ')).toBe('hello world');
  expect(makeChatTitle('a'.repeat(80), 40)).toHaveLength(40);
  expect(makeChatTitle('line one\nline two')).toBe('line one line two');
});
```

- [ ] **Step 2: Run tests → FAIL**

Run: `npm test -- validation format`
Expected: FAIL (module not found)

- [ ] **Step 3: Implement**

สร้าง `src/types/index.ts` ตาม data model ใน spec §9.3 (รวม `ThemeMode = 'light' | 'dark' | 'system'`)

`src/lib/validation.ts`:
- email regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- phone: ตัด `+`, space, `-`, `(` `)` แล้วเหลือ 9–15 หลัก
- base URL: trim → ต้องเริ่ม `http://` หรือ `https://` → ใช้ `new URL()` → คืน `url.origin + url.pathname` โดยตัด trailing slash

`src/lib/format.ts`:
- bytes → B/KB/MB/GB ทศนิยม 1 ตำแหน่ง
- relative: <60s = `now`, <60m = `Xm`, <24h = `Xh`, <7d = `Xd`, else `new Date().toLocaleDateString()`
- title: collapse whitespace, trim, slice + ellipsis

- [ ] **Step 4: Run tests → PASS**

Run: `npm test -- validation format`
Expected: PASS

- [ ] **Step 5: Type check + commit**

```bash
npx tsc --noEmit
git add src/types src/lib __tests__
git commit -m "feat: add types, validation, and formatting utilities"
```

---

## Task 3: NDJSON parser + context builder + Ollama client

**Files:**
- Create: `src/lib/ndjson.ts`, `src/lib/context.ts`, `src/api/ollama.ts`
- Test: `__tests__/ndjson.test.ts`, `__tests__/context.test.ts`, `__tests__/ollama.test.ts`

**Interfaces:**
- Produces:
  - `parseNdjsonChunk(buffer: string): { lines: string[]; rest: string }`
  - `buildContextMessages(messages: Message[], systemPrompt: string, options?: { maxMessages?: number; maxChars?: number }): OllamaMessage[]`
  - `class OllamaError extends Error { code: OllamaErrorCode }`
  - `class OllamaClient { constructor(baseUrl: string, fetchImpl?: FetchLike); testConnection(): Promise<{ latencyMs: number; modelCount: number }>; listModels(): Promise<OllamaModel[]>; chat(input: ChatInput, handlers: { onToken(token: string): void; signal?: AbortSignal }): Promise<{ content: string }>; pullModel(name: string, handlers: { onProgress(p: PullProgress): void; signal?: AbortSignal }): Promise<void>; deleteModel(name: string): Promise<void>; showModel(name: string): Promise<ModelDetails> }`

- [ ] **Step 1: เขียน failing tests**

```ts
// __tests__/ndjson.test.ts
import { parseNdjsonChunk } from '@/lib/ndjson';

test('keeps partial line in rest', () => {
  const r = parseNdjsonChunk('{"a":1}\n{"b":');
  expect(r.lines).toEqual(['{"a":1}']);
  expect(r.rest).toBe('{"b":');
});

test('splits multiple lines and ignores blanks', () => {
  const r = parseNdjsonChunk('{"a":1}\n\n{"b":2}\n');
  expect(r.lines).toEqual(['{"a":1}', '{"b":2}']);
  expect(r.rest).toBe('');
});
```

```ts
// __tests__/context.test.ts
import { buildContextMessages } from '@/lib/context';
import type { Message } from '@/types';

const msg = (id: string, role: Message['role'], content: string): Message => ({
  id, role, content, createdAt: Number(id),
});

test('always keeps system prompt first', () => {
  const out = buildContextMessages([], 'SYS', { maxMessages: 24, maxChars: 1000 });
  expect(out[0]).toEqual({ role: 'system', content: 'SYS' });
});

test('trims oldest messages but keeps system prompt', () => {
  const messages = Array.from({ length: 30 }, (_, i) => msg(String(i), i % 2 ? 'assistant' : 'user', `m${i}`));
  const out = buildContextMessages(messages, 'SYS', { maxMessages: 4, maxChars: 100000 });
  expect(out).toHaveLength(5);
  expect(out[0].content).toBe('SYS');
  expect(out.at(-1)?.content).toBe('m29');
});

test('respects char budget', () => {
  const messages = [msg('1','user','a'.repeat(100)), msg('2','assistant','b'.repeat(100))];
  const out = buildContextMessages(messages, 'SYS', { maxMessages: 24, maxChars: 120 });
  expect(out[0].content).toBe('SYS');
  expect(out.length).toBeLessThan(3);
});
```

```ts
// __tests__/ollama.test.ts
import { OllamaClient, OllamaError } from '@/api/ollama';

const okStream = (chunks: string[]) => ({
  ok: true,
  status: 200,
  body: {
    getReader: () => {
      let i = 0;
      return {
        read: async () => i < chunks.length
          ? { done: false, value: new TextEncoder().encode(chunks[i++]) }
          : { done: true, value: undefined },
      };
    },
  },
}) as any;

test('chat parses split NDJSON chunks', async () => {
  const fetchMock = jest.fn().mockResolvedValue(okStream([
    '{"message":{"content":"Hel',
    'lo"},"done":false}\n{"message":{"content":" world"},"done":true}\n',
  ]));
  const client = new OllamaClient('http://x', fetchMock as any);
  const tokens: string[] = [];
  const out = await client.chat({ model: 'm', messages: [] }, { onToken: t => tokens.push(t) });
  expect(out.content).toBe('Hello world');
  expect(tokens.join('')).toBe('Hello world');
});

test('maps 404 to model_not_found', async () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 404, text: async () => 'not found' } as any);
  const client = new OllamaClient('http://x', fetchMock as any);
  await expect(client.listModels()).rejects.toMatchObject({ code: 'model_not_found' });
});

test('maps network failure to network code', async () => {
  const fetchMock = jest.fn().mockRejectedValue(new TypeError('Network request failed'));
  const client = new OllamaClient('http://x', fetchMock as any);
  await expect(client.listModels()).rejects.toMatchObject({ code: 'network' });
});
```

- [ ] **Step 2: Run tests → FAIL**

Run: `npm test -- ndjson context ollama`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement**

- `parseNdjsonChunk`: split `\n`, last element เป็น `rest`, filter empty
- `buildContextMessages`: ใส่ system ก่อนถ้าไม่ว่าง; เริ่มจากข้อความใหม่สุดย้อนหลังจนครบ `maxMessages` และ `maxChars`; คงลำดับเดิม; map เป็น `{ role, content }`
- `OllamaError` codes: `'network' | 'timeout' | 'model_not_found' | 'server' | 'bad_request' | 'aborted' | 'unknown'`
- `OllamaClient`:
  - normalize baseUrl ผ่าน `normalizeBaseUrl`
  - `request(path, init)` ใส่ `AbortSignal.timeout` (test 8s, default 120s)
  - `listModels` → `GET /api/tags` → map เป็น `{ name, size, parameterSize, capabilities }`
  - `chat` → `POST /api/chat` `{ model, messages, stream: true, images? }`; อ่าน `res.body.getReader()`; decode; `parseNdjsonChunk`; `JSON.parse`; `onToken(json.message?.content ?? '')`; จบเมื่อ `done`
  - `pullModel` → `POST /api/pull`; parse `{ status, completed, total }`
  - `deleteModel` → `DELETE /api/delete`
  - `showModel` → `POST /api/show`
  - ถ้า `signal.aborted` → `OllamaError('aborted')`

- [ ] **Step 4: Run tests → PASS**

Run: `npm test -- ndjson context ollama`
Expected: PASS

- [ ] **Step 5: Type check + commit**

```bash
npx tsc --noEmit
git add src/lib/ndjson.ts src/lib/context.ts src/api __tests__
git commit -m "feat: add NDJSON parser, context builder, and Ollama client"
```

---

## Task 4: Theme tokens + ThemeProvider + fonts

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/typography.ts`, `src/theme/ThemeProvider.tsx`, `src/hooks/useAppTheme.ts`
- Modify: `app/_layout.tsx`
- Test: `__tests__/theme.test.ts`

**Interfaces:**
- Produces:
  - `themes: Record<'light' | 'dark', Theme>`
  - `Theme` fields: `bg, surface, surfaceAlt, control, text, textMuted, border, accent, accentStrong, danger, success`
  - `fonts: { heading: string; body: string; medium: string }`
  - `useAppTheme(): { theme: Theme; mode: ThemeMode; setMode(mode: ThemeMode): void; isDark: boolean }`
  - `ThemeProvider({ children })`

- [ ] **Step 1: เขียน failing test**

```ts
// __tests__/theme.test.ts
import { themes } from '@/theme/tokens';

test('light/dark have identical token keys', () => {
  expect(Object.keys(themes.light).sort()).toEqual(Object.keys(themes.dark).sort());
});

test('exact spec values', () => {
  expect(themes.light.bg).toBe('#FFFFFF');
  expect(themes.dark.bg).toBe('#121212');
  expect(themes.light.accent).toBe('#D6F5E3');
  expect(themes.dark.accent).toBe('#244A39');
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npm test -- theme`
Expected: FAIL

- [ ] **Step 3: Implement**

- `tokens.ts` ใช้ค่าจาก spec §8.2/§8.3 ครบทุก token
- `typography.ts`:
  ```ts
  export const fonts = { heading: 'InknutAntiqua_600SemiBold', body: 'Inter_400Regular', medium: 'Inter_500Medium' };
  export const type = { display: 32, title: 24, body: 16, label: 14, caption: 12 };
  ```
- `ThemeProvider.tsx`: ใช้ `useColorScheme()` + settings store `theme` mode; โหลดฟอนต์ด้วย `useFonts` จาก `@expo-google-fonts/inknut-antiqua` และ `@expo-google-fonts/inter`; แสดง `null`/splash จนโหลดเสร็จ; expose context
- `app/_layout.tsx`: ครอบ `ThemeProvider` + `GestureHandlerRootView` + `SafeAreaProvider` + `Stack`

- [ ] **Step 4: Run test → PASS**

Run: `npm test -- theme`
Expected: PASS

- [ ] **Step 5: Type check + commit**

```bash
npx tsc --noEmit
git add src/theme src/hooks app/_layout.tsx __tests__
git commit -m "feat: add theme tokens, provider, and fonts"
```

---

## Task 5: Base UI components

**Files:**
- Create: `src/components/Screen.tsx`, `AppButton.tsx`, `AppInput.tsx`, `AppCard.tsx`, `Avatar.tsx`, `IconButton.tsx`, `SectionHeader.tsx`, `SettingsRow.tsx`, `EmptyState.tsx`, `AttachmentChip.tsx`, `ConnectionBadge.tsx`, `Toast.tsx`, `ConfirmDialog.tsx`, `PromptDialog.tsx`
- Test: `__tests__/components.test.tsx`

**Interfaces:**
- Produces:
  - `AppButton({ label, onPress, variant?: 'primary'|'secondary'|'ghost'|'danger', size?: 'md'|'lg', loading?, disabled?, icon? })`
  - `AppInput({ label?, value, onChangeText, placeholder?, error?, multiline?, keyboardType?, autoCapitalize?, secureTextEntry? })`
  - `AppCard({ children, style? })`
  - `Avatar({ name, size? })` → วงกลมสี accent + initial
  - `IconButton({ name, onPress, accessibilityLabel, size? })`
  - `SectionHeader({ title })`
  - `SettingsRow({ label, value?, onPress?, destructive?, chevron? })`
  - `EmptyState({ title, description?, actionLabel?, onAction? })`
  - `ConnectionBadge({ status: 'unknown'|'online'|'offline'|'testing', label? })`
  - `ConfirmDialog({ visible, title, message, confirmLabel, destructive?, onConfirm, onCancel })`
  - `PromptDialog({ visible, title, placeholder, initialValue?, onSubmit, onCancel })`

- [ ] **Step 1: เขียน failing tests**

```tsx
// __tests__/components.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { AppButton } from '@/components/AppButton';
import { AppInput } from '@/components/AppInput';
import { SettingsRow } from '@/components/SettingsRow';

test('button calls onPress and blocks when disabled', () => {
  const onPress = jest.fn();
  const { getByText, rerender } = render(<AppButton label="Save" onPress={onPress} />);
  fireEvent.press(getByText('Save'));
  expect(onPress).toHaveBeenCalledTimes(1);
  rerender(<AppButton label="Save" onPress={onPress} disabled />);
  fireEvent.press(getByText('Save'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('input shows error text', () => {
  const { getByText } = render(
    <AppInput label="Email" value="" onChangeText={() => {}} error="Invalid email" />
  );
  expect(getByText('Email')).toBeTruthy();
  expect(getByText('Invalid email')).toBeTruthy();
});

test('settings row fires onPress', () => {
  const onPress = jest.fn();
  const { getByText } = render(<SettingsRow label="Theme" value="Light" onPress={onPress} />);
  fireEvent.press(getByText('Theme'));
  expect(onPress).toHaveBeenCalled();
});
```

- [ ] **Step 2: Run tests → FAIL**

Run: `npm test -- components`
Expected: FAIL (modules not found)

- [ ] **Step 3: Implement components**

- ทุก component ใช้ `useAppTheme()` และ tokens; ไม่มี hex ใน component
- ปุ่ม: pill radius 999, height 48/56, `Pressable` + `accessibilityRole="button"`, `minHeight: 44`
- Input: pill radius 40, bg `control`, padding 16, label/error ใช้ `caption`
- Avatar: วงกลม `accent`, ตัวอักษรแรกด้วย `fonts.heading`
- Dialog: ใช้ `Modal` + `AppCard` + ปุ่ม Cancel/Confirm

- [ ] **Step 4: Run tests → PASS**

Run: `npm test -- components`
Expected: PASS

- [ ] **Step 5: Type check + commit**

```bash
npx tsc --noEmit
git add src/components __tests__
git commit -m "feat: add base UI component library"
```

---

## Task 6: Storage + settings store + chats store

**Files:**
- Create: `src/lib/storage.ts`, `src/store/settingsStore.ts`, `src/store/chatsStore.ts`
- Test: `__tests__/settingsStore.test.ts`, `__tests__/chatsStore.test.ts`

**Interfaces:**
- Produces:
  - `storage.get<T>(key): Promise<T | null>`, `storage.set<T>(key, value): Promise<void>`, `storage.remove(key)`, `storage.clearAll()`
  - `SK` constants: `settings`, `chatsIndex`, `chat(id)`, `version`
  - `useSettingsStore`: `{ settings, hydrated, hydrate(), update(partial), reset() }`
  - `DEFAULT_SETTINGS: Settings`
  - `useChatsStore`: `{ index, activeChat, hydrated, hydrate(), createChat(title?), openChat(id), renameChat(id, title), deleteChat(id), appendMessage(chatId, message), updateMessage(chatId, messageId, patch, opts?), persistChat(chatId), clearAllChats() }`

- [ ] **Step 1: เขียน failing tests**

```ts
// __tests__/settingsStore.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettingsStore, DEFAULT_SETTINGS } from '@/store/settingsStore';

beforeEach(async () => { await AsyncStorage.clear(); useSettingsStore.setState({ settings: DEFAULT_SETTINGS, hydrated: false }); });

test('hydrate returns defaults when empty', async () => {
  await useSettingsStore.getState().hydrate();
  expect(useSettingsStore.getState().settings.baseUrl).toBe('');
  expect(useSettingsStore.getState().hydrated).toBe(true);
});

test('update persists merged settings', async () => {
  await useSettingsStore.getState().update({ baseUrl: 'http://x:11434' });
  expect(useSettingsStore.getState().settings.baseUrl).toBe('http://x:11434');
  const raw = await AsyncStorage.getItem('ocbm:settings');
  expect(JSON.parse(raw!).baseUrl).toBe('http://x:11434');
});
```

```ts
// __tests__/chatsStore.test.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChatsStore } from '@/store/chatsStore';

beforeEach(async () => { await AsyncStorage.clear(); useChatsStore.setState({ index: [], activeChat: null, hydrated: false }); });

test('createChat adds to index and persists', async () => {
  const chat = await useChatsStore.getState().createChat();
  expect(useChatsStore.getState().index).toHaveLength(1);
  expect(chat.title).toBe('New chat');
  expect(await AsyncStorage.getItem(`ocbm:chat:${chat.id}`)).not.toBeNull();
});

test('appendMessage updates index and chat', async () => {
  const chat = await useChatsStore.getState().createChat();
  await useChatsStore.getState().appendMessage(chat.id, {
    id: 'm1', role: 'user', content: 'Hello', createdAt: Date.now(),
  });
  const state = useChatsStore.getState();
  expect(state.activeChat?.messages).toHaveLength(1);
  expect(state.index[0].preview).toBe('Hello');
});

test('hydrate marks stale streaming messages as error', async () => {
  const chat = await useChatsStore.getState().createChat('Test');
  await useChatsStore.getState().appendMessage(chat.id, {
    id: 'm1', role: 'assistant', content: 'partial', createdAt: Date.now(), status: 'streaming',
  });
  useChatsStore.setState({ activeChat: null, index: [], hydrated: false });
  await useChatsStore.getState().hydrate();
  await useChatsStore.getState().openChat(chat.id);
  expect(useChatsStore.getState().activeChat?.messages[0].status).toBe('error');
});
```

- [ ] **Step 2: Run tests → FAIL**

Run: `npm test -- settingsStore chatsStore`
Expected: FAIL

- [ ] **Step 3: Implement**

- `storage.ts`: JSON serialize/deserialize, try/catch, `clearAll` ลบ keys ที่ขึ้นต้น `ocbm:`
- `settingsStore`: `DEFAULT_SETTINGS = { baseUrl: '', defaultModel: '', theme: 'system', systemPrompt: '', personalContext: '', profile: { name: 'You', email: '', phone: '' }, onboardingComplete: false }`
- `chatsStore`:
  - `createChat`: id = `Date.now().toString(36) + random`; title default `'New chat'`; persist index + chat
  - `appendMessage`: push เข้า activeChat, อัปเดต `title` จากข้อความ user แรกถ้ายังเป็น `'New chat'`, preview = 80 ตัวอักษร, updatedAt; persist
  - `updateMessage(..., { persist = false })`: อัปเดตใน memory; ถ้า `persist` เขียนทันที
  - `persistChat`: เขียน `ocbm:chat:<id>` + index
  - `hydrate`: โหลด index; สำหรับ active chat ปล่อย null; เมื่อ `openChat` ให้โหลด และ map message ที่ `status` เป็น `sending`/`streaming` → `error` + error message
  - `clearAllChats`: ลบ chat keys + index

- [ ] **Step 4: Run tests → PASS**

Run: `npm test -- settingsStore chatsStore`
Expected: PASS

- [ ] **Step 5: Type check + commit**

```bash
npx tsc --noEmit
git add src/lib/storage.ts src/store __tests__
git commit -m "feat: add storage, settings store, and chats store"
```

---

## Task 7: Navigation shell + app bootstrap + drawer

**Files:**
- Create: `app/index.tsx`, `app/(drawer)/_layout.tsx`, `app/(drawer)/index.tsx` (placeholder chat), `app/settings/_layout.tsx`, `app/settings/index.tsx` (placeholder), `src/components/DrawerContent.tsx`
- Modify: `app/_layout.tsx`
- Test: manual + `npx expo export --platform web`

**Interfaces:**
- Consumes: `useSettingsStore`, `useChatsStore`, `useAppTheme`, `AppButton`, `Avatar`
- Produces: navigation graph ทำงาน; refresh/redirect ไป onboarding เมื่อ `onboardingComplete === false`

- [ ] **Step 1: Implement bootstrap ใน `app/_layout.tsx`**

- `useEffect` เรียก `hydrate()` ทั้งสอง store
- ขณะ `!hydrated` แสดง splash/loading
- `Stack` ซ่อน header (`screenOptions={{ headerShown: false }}`)
- ครอบ `ThemeProvider`

- [ ] **Step 2: Implement `app/index.tsx`**

```tsx
import { Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';

export default function Index() {
  const hydrated = useSettingsStore(s => s.hydrated);
  const onboardingComplete = useSettingsStore(s => s.settings.onboardingComplete);
  if (!hydrated) return null;
  return <Redirect href={onboardingComplete ? '/(drawer)' : '/onboarding'} />;
}
```

- [ ] **Step 3: Implement drawer**

- `app/(drawer)/_layout.tsx` ใช้ `Drawer` จาก `expo-router/drawer` + `drawerContent={(props) => <DrawerContent {...props} />}`
- ซ่อน default header; `drawerType="front"`; `swipeEdgeWidth={40}`
- `DrawerContent`: title "OCBM", New Chat button, Search button, chat history list (จาก `index`), profile row → `/settings`
- `New Chat`: `createChat()` แล้ว `router.replace('/(drawer)')`
- `Search`: `router.push('/search')`

- [ ] **Step 4: Implement settings stack**

- `app/settings/_layout.tsx`: `Stack` headerShown false
- `app/settings/index.tsx`: placeholder พร้อม title "Settings" และปุ่ม back

- [ ] **Step 5: Verify web export**

Run: `npx expo export --platform web`
Expected: PASS, มี `dist/` และไม่มี bundling error

- [ ] **Step 6: Visual QA ด้วย Playwright**

Run: `npx expo start --web --port 8081` (background)
เปิด `http://localhost:8081` ใน Playwright, screenshot, ตรวจว่า redirect ไป onboarding/chat โดยไม่ error
Expected: หน้าโหลดได้, ไม่มี red screen

- [ ] **Step 7: Commit**

```bash
git add app src/components/DrawerContent.tsx
git commit -m "feat: add navigation shell, drawer, and bootstrap"
```

---

## Task 8: Chat screen + streaming + composer

**Files:**
- Create: `src/components/ChatBubble.tsx`, `src/components/Composer.tsx`
- Modify: `app/(drawer)/index.tsx`
- Test: `__tests__/chatSend.test.ts` (logic helper), visual QA

**Interfaces:**
- Consumes: `OllamaClient`, `useChatsStore`, `useSettingsStore`, `buildContextMessages`, `AppButton`, `AppInput`
- Produces:
  - `composeRequest(chat: Chat, settings: Settings): { model: string; messages: OllamaMessage[] }`
  - Chat screen: empty state, message list, streaming, stop, retry

- [ ] **Step 1: เขียน failing test สำหรับ `composeRequest`**

```ts
// __tests__/chatSend.test.ts
import { composeRequest } from '@/lib/chatSend';
import type { Chat, Settings } from '@/types';

const settings = { defaultModel: 'qwen2.5:3b', systemPrompt: 'SYS', personalContext: 'P' } as Settings;
const chat = {
  id: 'c1', title: 'T', createdAt: 1, updatedAt: 1,
  messages: [{ id: 'm1', role: 'user', content: 'Hi', createdAt: 1 }],
} as Chat;

test('includes system prompt, personal context, and model', () => {
  const out = composeRequest(chat, settings);
  expect(out.model).toBe('qwen2.5:3b');
  expect(out.messages[0].role).toBe('system');
  expect(out.messages[0].content).toContain('SYS');
  expect(out.messages[0].content).toContain('P');
  expect(out.messages.at(-1)?.content).toBe('Hi');
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npm test -- chatSend`
Expected: FAIL

- [ ] **Step 3: Implement `src/lib/chatSend.ts`**

```ts
export function composeRequest(chat: Chat, settings: Settings): { model: string; messages: OllamaMessage[] } {
  const system = [settings.systemPrompt, settings.personalContext].filter(Boolean).join('\n\n');
  return { model: settings.defaultModel, messages: buildContextMessages(chat.messages, system) };
}
```

- [ ] **Step 4: Implement `ChatBubble`**

- User: align right, bg `accent`, radius 20 (มุมขวาล่าง 6), text `text`
- Assistant: align left, bg `surface`, radius 20 (มุมซ้ายล่าง 6)
- Assistant ใช้ `Markdown` จาก `react-native-markdown-display`; code block ใช้ `surfaceAlt` + monospace
- แสดงเวลา, status `error` + ปุ่ม Retry, `streaming` + dots
- Long-press → copy (expo-clipboard) / regenerate (assistant)

- [ ] **Step 5: Implement chat screen**

- Header: `IconButton` menu → `navigation.openDrawer()`; model name + `ConnectionBadge`; new chat
- Message list: ใช้ `FlatList` แบบ `inverted` + เรียงข้อมูลจากใหม่ไปเก่า (chat มาตรฐาน)
- Empty state: "Ask anything" + suggested prompts (3 ปุ่ม) → เติม input
- Composer: input + attach + send/stop
- Send flow:
  1. trim; ถ้าว่าง return
  2. append user message
  3. append assistant placeholder `status: 'streaming'`
  4. `client.chat(composeRequest(...), { onToken: t => updateMessage(..., { content: acc + t }, { persist: false }) , signal })`
  5. on done → `updateMessage(..., { status: 'done' }, { persist: true })`
  6. on error → `status: 'error'`, `error: mapped message`, `persist: true`
  7. stop → `controller.abort()` → mark `done` (เก็บข้อความที่ได้)
- ปุ่ม send disabled เมื่อ input ว่างหรือกำลัง stream
- Offline banner: ถ้า `useConnectionStore.status === 'offline'` แสดงแถบเหนือ composer
  "Cannot reach Ollama" + ปุ่ม "Settings" → `/settings/connection`
- Refresh connection status เมื่อ screen focus (`useFocusEffect`) ถ้ามี baseUrl

- [ ] **Step 6: Run test + type check**

Run: `npm test -- chatSend && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Visual QA (web)**

เปิด web, ตรวจ empty state, พิมพ์ข้อความ, กด send (ถ้า Ollama CORS ไม่ผ่าน ให้ใช้ mock server หรือ native test)
Expected: UI ทำงาน, ไม่ crash

- [ ] **Step 8: Commit**

```bash
git add app/(drawer)/index.tsx src/components/ChatBubble.tsx src/components/Composer.tsx src/lib/chatSend.ts __tests__
git commit -m "feat: add chat screen with streaming and composer"
```

---

## Task 9: Drawer history + search

**Files:**
- Create: `src/lib/search.ts`, `app/search.tsx`
- Modify: `src/components/DrawerContent.tsx`
- Test: `__tests__/search.test.ts`

**Interfaces:**
- Produces:
  - `searchChats(index: ChatSummary[], query: string): ChatSummary[]`
  - `searchMessages(chat: Chat, query: string): { messageId: string; snippet: string }[]`

- [ ] **Step 1: เขียน failing test**

```ts
// __tests__/search.test.ts
import { searchChats } from '@/lib/search';
import type { ChatSummary } from '@/types';

const index: ChatSummary[] = [
  { id: '1', title: 'Recipe ideas', preview: 'pasta', createdAt: 1, updatedAt: 2, messageCount: 2 },
  { id: '2', title: 'Code help', preview: 'react native', createdAt: 1, updatedAt: 1, messageCount: 1 },
];

test('case-insensitive title/preview search', () => {
  expect(searchChats(index, 'PASTA').map(c => c.id)).toEqual(['1']);
  expect(searchChats(index, 'react')).toHaveLength(1);
  expect(searchChats(index, '')).toHaveLength(2);
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npm test -- search`
Expected: FAIL

- [ ] **Step 3: Implement search + screen**

- `searchChats`: lowercase includes title/preview
- `searchMessages`: lowercase includes content; snippet = ±40 chars รอบ match
- `app/search.tsx`: input + results; กด result → `openChat(id)` + `router.replace('/(drawer)')`
- Drawer: search row + history list; long-press → `PromptDialog` rename / `ConfirmDialog` delete

- [ ] **Step 4: Run test → PASS**

Run: `npm test -- search`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/search.ts app/search.tsx src/components/DrawerContent.tsx __tests__
git commit -m "feat: add chat history search and drawer actions"
```

---

## Task 10: Settings — account, email, phone, customize AI, personal intelligence, theme

**Files:**
- Create: `app/settings/email.tsx`, `app/settings/phone.tsx`, `app/settings/customize.tsx`, `app/settings/personal-intelligence.tsx`, `app/settings/theme.tsx`, `app/settings/about.tsx`
- Modify: `app/settings/index.tsx`
- Test: visual QA + existing validation/store tests

**Interfaces:**
- Consumes: `useSettingsStore`, `isValidEmail`, `isValidPhone`, `AppInput`, `AppButton`, `SettingsRow`
- Produces: หน้าจอ settings ครบตาม Figma + ส่วนขยาย

- [ ] **Step 1: Implement Settings index**

- Avatar + name + email
- `SectionHeader title="Account Settings"` → Email, Phone Number, Personal Intelligence
- `SectionHeader title="AI Settings"` → Connection Settings, Model Management, Customize AI
- `SectionHeader title="General & UI"` → Theme, Chat History Management
- `SectionHeader title="About"` → Version
- Back button → `router.back()`

- [ ] **Step 2: Implement Email screen**

- input `keyboardType="email-address"`, `autoCapitalize="none"`
- ปุ่ม Add → validate; ถ้าผิดแสดง error; ถ้าถูก `update({ profile: { ...profile, email } })` + `router.back()`
- ปุ่ม Back

- [ ] **Step 3: Implement Phone screen**

- input `keyboardType="phone-pad"`
- validate ด้วย `isValidPhone`
- save + back

- [ ] **Step 4: Implement Customize AI**

- `TextInput multiline` ผูก `systemPrompt`
- Save → `update({ systemPrompt })` + back
- Reset → `update({ systemPrompt: '' })`
- แสดงตัวอย่าง prompt ที่จะถูกส่ง

- [ ] **Step 5: Implement Personal Intelligence**

- `TextInput multiline` ผูก `personalContext`
- Save/reset + back
- Help text อธิบายว่า context นี้จะถูกส่งต่อท้าย system prompt

- [ ] **Step 6: Implement Theme screen**

- 3 options: Light / Dark / System → `update({ theme })`
- แสดง preview สี

- [ ] **Step 7: Implement About**

- App name, version, link to docs, "Reset app" (confirm) → `storage.clearAll()` + reset stores + `router.replace('/onboarding')`

- [ ] **Step 8: Implement Clear chat history + Reset app**

- Settings → "Chat History Management": แสดงจำนวนแชท + ปุ่ม "Clear chat history"
- กด → `ConfirmDialog` → `clearAllChats()` (ไม่ลบ settings)
- About → "Reset app": `ConfirmDialog` → `storage.clearAll()` + reset settings/chats stores + `router.replace('/onboarding')`

- [ ] **Step 9: Visual QA + type check**

Run: `npx tsc --noEmit` + เปิด web ตรวจทุกหน้า
Expected: PASS

- [ ] **Step 10: Commit**

```bash
git add app/settings
git commit -m "feat: add settings screens for profile, AI, theme, and about"
```

---

## Task 11: Connection settings + model management

**Files:**
- Create: `src/store/connectionStore.ts`, `app/settings/connection.tsx`, `app/settings/models.tsx`, `src/components/ModelRow.tsx`
- Test: `__tests__/connectionStore.test.ts`

**Interfaces:**
- Consumes: `OllamaClient`, `useSettingsStore`, `AppInput`, `AppButton`, `ConnectionBadge`, `ModelRow`
- Produces:
  - `useConnectionStore`: `{ status, latencyMs, models, error, pulling, refresh(baseUrl, client?), test(baseUrl, client?), startPull(baseUrl, name, client?), cancelPull(), removeModel(baseUrl, name, client?) }`
  - `PullingState = { name: string; status: string; completed?: number; total?: number } | null`

- [ ] **Step 1: เขียน failing test**

```ts
// __tests__/connectionStore.test.ts
import { useConnectionStore } from '@/store/connectionStore';

const mockClient = {
  testConnection: jest.fn().mockResolvedValue({ latencyMs: 12, modelCount: 2 }),
  listModels: jest.fn().mockResolvedValue([
    { name: 'qwen2.5:3b', size: 1000, parameterSize: '3B', capabilities: ['completion'] },
  ]),
};

beforeEach(() => {
  useConnectionStore.setState({ status: 'unknown', models: [], error: undefined, latencyMs: undefined });
});

test('test success sets online + latency', async () => {
  await useConnectionStore.getState().test('http://x', mockClient as any);
  expect(useConnectionStore.getState().status).toBe('online');
  expect(useConnectionStore.getState().latencyMs).toBe(12);
});

test('test failure sets offline + error', async () => {
  const failing = { testConnection: jest.fn().mockRejectedValue({ code: 'network', message: 'no' }) };
  await useConnectionStore.getState().test('http://x', failing as any);
  expect(useConnectionStore.getState().status).toBe('offline');
  expect(useConnectionStore.getState().error).toBeTruthy();
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npm test -- connectionStore`
Expected: FAIL

- [ ] **Step 3: Implement connection store**

- `test(baseUrl, client?)`: status `testing` → success `online` + latency; fail `offline` + error message mapping
- `refresh`: `listModels` + set models
- `startPull`: status `pulling`; onProgress update; on done refresh + clear; on error set error
- `cancelPull`: abort controller
- `removeModel`: delete + refresh

- [ ] **Step 4: Implement Connection Settings screen**

- Base URL input + hint text (emulator/LAN)
- Test Connection button → loading + status badge + latency + model count
- Save → `update({ baseUrl })`
- Help card: `OLLAMA_HOST=0.0.0.0`, firewall, IP example
- Back

- [ ] **Step 5: Implement Model Management screen**

- Default Model: list/select จาก `models` (radio rows)
- Downloaded Models: `ModelRow` (name, size, parameter size, capabilities badges, delete button with confirm)
- Pull New Model: input + Pull button + progress bar + cancel
- Save → `update({ defaultModel })`
- Back

- [ ] **Step 6: Run tests + type check**

Run: `npm test -- connectionStore && npx tsc --noEmit`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add src/store/connectionStore.ts app/settings/connection.tsx app/settings/models.tsx src/components/ModelRow.tsx __tests__
git commit -m "feat: add connection settings and model management"
```

---

## Task 12: Onboarding

**Files:**
- Create: `app/onboarding.tsx`
- Test: visual QA + manual

**Interfaces:**
- Consumes: `OllamaClient`, `useSettingsStore`, `useConnectionStore`, `AppButton`, `AppInput`, `ConnectionBadge`
- Produces: flow 3 steps (Welcome → Connection → Model) → `onboardingComplete: true` → `/(drawer)`

- [ ] **Step 1: Implement 3-step onboarding**

- Step 1: Welcome (title, description, "Get started")
- Step 2: Base URL + Test Connection + status; ปุ่ม Continue disabled จน test ผ่าน (หรือข้ามได้พร้อม warning)
- Step 3: เลือก default model จาก `models`; ถ้าไม่มี ให้ pull `qwen2.5:3b` หรือข้าม
- Finish → `update({ baseUrl, defaultModel, onboardingComplete: true })` → `router.replace('/(drawer)')`

- [ ] **Step 2: Handle edge cases**

- test fail → แสดง error + retry + "Continue anyway"
- models ว่าง → แสดง empty state + ปุ่ม refresh
- ปุ่ม back ระหว่าง step

- [ ] **Step 3: Visual QA + type check**

Run: `npx tsc --noEmit` + web screenshot
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/onboarding.tsx
git commit -m "feat: add first-run onboarding flow"
```

---

## Task 13: Attachments (images + text files)

**Files:**
- Create: `src/lib/attachments.ts`, `src/components/AttachmentChip.tsx`
- Modify: `src/components/Composer.tsx`, `app/(drawer)/index.tsx`, `src/api/ollama.ts` (images field)
- Test: `__tests__/attachments.test.ts`

**Interfaces:**
- Produces:
  - `MAX_IMAGES = 4`, `MAX_IMAGE_BYTES = 10 * 1024 * 1024`, `MAX_TEXT_BYTES = 100 * 1024`
  - `validateAttachment(input: { kind, size, mimeType }, current: Attachment[]): { ok: true } | { ok: false; code: 'too_many'|'too_large'|'unsupported'; message: string }`
  - `readTextFile(uri: string): Promise<string>`
  - `toOllamaImages(attachments: Attachment[]): Promise<string[]>`

- [ ] **Step 1: เขียน failing test**

```ts
// __tests__/attachments.test.ts
import { validateAttachment, MAX_IMAGES } from '@/lib/attachments';

test('rejects too many images', () => {
  const current = Array.from({ length: MAX_IMAGES }, (_, i) => ({
    id: String(i), kind: 'image' as const, uri: 'x', name: 'x', mimeType: 'image/png', size: 10,
  }));
  expect(validateAttachment({ kind: 'image', size: 10, mimeType: 'image/png' }, current))
    .toMatchObject({ ok: false, code: 'too_many' });
});

test('rejects oversized image and text', () => {
  expect(validateAttachment({ kind: 'image', size: 11 * 1024 * 1024, mimeType: 'image/png' }, []))
    .toMatchObject({ ok: false, code: 'too_large' });
  expect(validateAttachment({ kind: 'text', size: 101 * 1024, mimeType: 'text/plain' }, []))
    .toMatchObject({ ok: false, code: 'too_large' });
});

test('rejects unsupported mime', () => {
  expect(validateAttachment({ kind: 'image', size: 100, mimeType: 'application/pdf' }, []))
    .toMatchObject({ ok: false, code: 'unsupported' });
});
```

- [ ] **Step 2: Run test → FAIL**

Run: `npm test -- attachments`
Expected: FAIL

- [ ] **Step 3: Implement validation + file handling**

- image mime ต้องเริ่ม `image/`; text mime ต้องเป็น `text/*` หรือ `application/json`
- copy ไฟล์เข้า `FileSystem.documentDirectory + 'attachments/'`
- text file อ่าน content (cap 100KB), image อ่าน base64 ตอนส่งเท่านั้น
- `AttachmentChip`: thumbnail (image) หรือ icon + ชื่อ + size + ปุ่ม X

- [ ] **Step 4: Integrate composer**

- ปุ่ม `+` เปิด action sheet: "Photo" / "File"
- Photo → `ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 })`
- File → `DocumentPicker.getDocumentAsync({ type: ['text/*', 'application/json'] })`
- validate → add/remove chips
- Send: images → `images` base64 array; text → ต่อท้าย content เป็น block
- ตรวจ `capabilities.includes('vision')`; ถ้าไม่มี → `Alert` เตือนก่อนส่ง

- [ ] **Step 5: Run tests → PASS**

Run: `npm test -- attachments`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/lib/attachments.ts src/components/AttachmentChip.tsx src/components/Composer.tsx app/(drawer)/index.tsx src/api/ollama.ts __tests__
git commit -m "feat: add image and text file attachments"
```

---

## Task 14: Docs + EAS + final QA

**Files:**
- Create: `README.md`, `docs/DESIGN.md`, `docs/ARCHITECTURE.md`, `docs/ROADMAP.md`, `docs/CHANGELOG.md`, `eas.json`, `.easignore`
- Modify: `app.json` (version/build)

**Interfaces:**
- Produces: เอกสารครบ + build profile

- [ ] **Step 1: เขียน `README.md`**

ต้องมี:
- Overview + features
- Prerequisites (Node, Expo Go, Ollama)
- Ollama setup: `OLLAMA_HOST=0.0.0.0`, `OLLAMA_ORIGINS=*`, firewall 11434, หา LAN IP
- Run: `npm install`, `npx expo start`, scan QR
- Web QA: `npx expo start --web`
- Tests: `npm test`, `npx tsc --noEmit`
- Build APK: EAS steps
- Troubleshooting: connection refused, cleartext, model not found, vision model
- Project structure

- [ ] **Step 2: เขียน `docs/DESIGN.md`**

- Design tokens (light/dark), typography, spacing, radius
- Component inventory + usage
- Figma screen mapping (8 screens → routes)
- หลักการออกแบบ: serif headings + clean sans body, pill controls, soft gray surfaces

- [ ] **Step 3: เขียน `docs/ARCHITECTURE.md`**

- Folder structure
- Data flow: screen → store → client → Ollama
- Persistence keys + schema version
- Streaming sequence
- Error handling strategy
- Attachment storage

- [ ] **Step 4: เขียน `docs/ROADMAP.md`**

- iOS build
- Vision models
- Voice input/output
- RAG / file indexing
- Multi-provider (LM Studio, OpenAI-compatible)
- Sync

- [ ] **Step 5: เขียน `docs/CHANGELOG.md`**

- `1.0.0` — initial release notes

- [ ] **Step 6: สร้าง `eas.json`**

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "development": { "developmentClient": true, "distribution": "internal" },
    "preview": { "distribution": "internal", "android": { "buildType": "apk" } },
    "production": { "autoIncrement": true }
  },
  "submit": { "production": {} }
}
```

- [ ] **Step 7: Final verification**

Run:
```bash
npx tsc --noEmit
npm test -- --runInBand
npx expo export --platform web
npx expo export --platform android
```
Expected: ทุกคำสั่ง PASS

- [ ] **Step 8: Visual QA ด้วย Playwright**

- เปิด web, screenshot: onboarding, chat empty, chat with messages (mock), drawer, settings, connection, models
- เทียบกับ Figma: spacing, radius, สี, ฟอนต์
- ตรวจ dark mode ทุกหน้า

- [ ] **Step 9: Commit**

```bash
git add README.md docs eas.json .easignore app.json
git commit -m "docs: add project documentation and build config"
```
