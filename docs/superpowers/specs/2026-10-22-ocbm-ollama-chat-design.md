# OCBM — Ollama Mobile Chat App (Android First) — Design

วันที่: 2026-10-22
สถานะ: รออนุมัติ design

## 1. Intent / Why

สร้างแอปมือถือแชท AI ที่เชื่อมกับ **Ollama** ในเครื่องผู้ใช้ โดยอิง UI จากไฟล์ Figma
`UlqICuEsPGwxmcNTVuLngR` (8 หน้าจอ) และขยายหน้าจอที่ยังไม่มีใน Figma ด้วยภาษาดีไซน์เดียวกัน

เป้าหมายคือให้ผู้ใช้เปิดแอปแล้วคุยกับโมเดล local ได้ทันที เลือกโมเดล/ดึงโมเดล/ตั้งค่า
connection ได้จากในแอป และเก็บประวัติแชทไว้ในเครื่องโดยไม่ต้องมี backend

ทำ **Android ก่อน** แต่โค้ดต้องพร้อมต่อยอด iOS ภายหลัง

## 2. Goals

- แชทกับ Ollama ได้แบบ streaming พร้อมปุ่มหยุด
- จัดการหลายบทสนทนา: สร้าง, เปลี่ยนชื่อ, ลบ, ค้นหา
- ตั้งค่า Base URL + Test Connection
- จัดการโมเดล: ดูรายการ, เลือก default, pull โมเดลใหม่พร้อม progress, ลบโมเดล
- ปรับ system prompt ("Customize your AI")
- โปรไฟล์ local: ชื่อ, อีเมล, เบอร์โทร (ไม่ต้องมี server)
- Light / Dark / System theme
- แนบรูปภาพได้ (UI + ส่ง base64 ไป Ollama) และแนบไฟล์ข้อความ
- เก็บประวัติแชทและ settings ในเครื่อง (offline-first)
- มีเอกสาร `.md` ครบ: README, design system, architecture, roadmap, changelog

## 3. Non-goals (v1)

- ไม่มี backend / cloud sync / login จริง
- ไม่มี voice input/output
- ไม่มี RAG / indexing ไฟล์ทั้งเครื่อง
- ไม่มี syntax highlighting ระดับ IDE (styled code block พอ)
- ไม่มี real-time multi-device sync
- ไม่ได้ทำ iOS build ในรอบนี้ (แต่โครงสร้างรองรับ)

## 4. Anti-goals

- แอปที่ต้องพึ่ง cloud ถึงจะแชทได้
- UI คนละภาษากับ Figma (เช่น เปลี่ยนเป็น Material 3 ทั้งหมด)
- เก็บข้อความแบบหลุด/hardcode จนแก้ไขหรือลบไม่ได้
- ปล่อยให้ error เครือข่ายทำให้แอปค้างโดยไม่มีทางออก

## 5. Constraints

- เครื่อง dev มี Node.js 24, npm 11, Java 25, Git
- **ไม่มี Android Studio / Android SDK / Flutter** → ใช้ Expo Go ในการรันบนเครื่องจริง
  และใช้ EAS Build เมื่อต้องการ APK
- Ollama v0.40.8 ทำงานที่ `127.0.0.1:11434`
- โมเดลที่มีอยู่: `qwen2.5:3b`, `qwen3:1.7b`, `qwen2.5-coder:3b`, `qwen2.5-coder:7b`,
  `qwen2.5-coder:latest` — **ยังไม่มีโมเดล vision**
- มือถือต้องเข้าถึง PC ผ่าน LAN → Ollama ต้อง bind `0.0.0.0` และเปิด firewall port 11434
- Android ต้องอนุญาต cleartext HTTP (`usesCleartextTraffic`) สำหรับ `http://`

## 6. Approaches

| ทาง | ข้อดี | ข้อเสีย | สรุป |
|---|---|---|---|
| A. React Native + Expo (TS) | เริ่มได้ทันทีด้วย Expo Go, cross-platform, ecosystem ครบ, web preview สำหรับ QA | native module บางตัวต้อง prebuild, APK ต้อง EAS/Android SDK | **เลือก** |
| B. Flutter | UI consistency ดี, performance ดี | ต้องติดตั้ง Flutter + Android SDK, เขียนใหม่ทั้งหมด, เครื่องยังไม่พร้อม | ไม่เลือก |
| C. Native Kotlin + Compose | Android แท้, performance ดีที่สุด | Android-only, ต้อง Android Studio, iOS ต้องเขียนใหม่ | ไม่เลือก |

เหตุผลที่เลือก A: เครื่องพร้อมที่สุด (มี Node), ผู้ใช้ยังฝึกอยู่, ต้องการ Android ก่อนแต่มี iOS ในอนาคต,
และ Expo Go ทำให้เห็นแอปบนมือถือได้โดยไม่ต้องติดตั้ง Android SDK

## 7. Product Spec — Screens & Flows

### 7.1 Chat (จาก Figma iPhone 17 - 1)
- Header: ปุ่มเมนู (ซ้าย), ชื่อโมเดล + connection dot (กลาง), ปุ่ม new chat (ขวา)
- Message list:
  - Empty state: โลโก้/ชื่อแอป, ข้อความต้อนรับ, suggested prompts 3–4 ปุ่ม
  - User bubble: ชิดขวา, พื้น accent อ่อน
  - Assistant bubble: ชิดซ้าย, พื้น surface, รองรับ markdown/code block
  - Streaming indicator (dots) + ปุ่ม Stop
  - Error bubble + Retry
- Composer:
  - ปุ่ม `+` แนบรูป/ไฟล์
  - attachment preview chips เหนือ input
  - input "Ask ollama"
  - ปุ่มส่ง (arrow) / ปุ่มหยุดเมื่อกำลัง stream
- Auto-scroll, KeyboardAvoidingView, safe area
- Long-press message → copy / regenerate (assistant)

### 7.2 Drawer (จาก Figma iPhone 17 - 2)
- ชื่อแอป "OCBM" (สไตล์ Inknut Antiqua)
- ปุ่ม New Chat, Search
- รายการแชท: title, preview, relative time; long-press → rename/delete
- แถบล่าง: avatar + ชื่อผู้ใช้ → เปิด Settings
- ปุ่ม Settings (gear) เสริม

### 7.3 Settings (จาก Figma iPhone 17 - 3)
- Avatar + ชื่อ + อีเมล
- Section "Account Settings": Email, Phone Number, Personal Intelligence
  - Personal Intelligence = หน้าแก้ "personal context" (ความจำ/ความชอบ/ข้อมูลส่วนตัวที่อยากให้ AI จำ)
    เก็บ local และต่อท้าย system prompt เมื่อแชท
- Section "AI Settings": Connection Settings, Model Management, Customize AI
- Section "General & UI": Theme (Light/Dark/System), Chat History Management (clear all)
- About: เวอร์ชันแอป, ลิงก์เอกสาร
- ปุ่ม Back

### 7.4 Add Email (Figma iPhone 17 - 4)
- Input อีเมล + ปุ่ม Add
- Validate รูปแบบอีเมล, แสดง error ใต้ input
- ปุ่ม Back

### 7.5 Add Phone (Figma iPhone 17 - 5)
- Input เบอร์ + ปุ่ม Add
- Validate ตัวเลข 9–15 หลัก (อนุญาต +, -, space)
- ปุ่ม Back

### 7.6 Customize AI (Figma iPhone 17 - 6)
- Textarea system prompt
- ปุ่ม Save, ปุ่ม Reset to default
- แสดงตัวอย่าง prompt ที่ใช้จริง
- ปุ่ม Back

### 7.7 Connection Settings (Figma iPhone 17 - 7)
- Input Base URL (default ว่าง; hint `http://10.0.2.2:11434` สำหรับ emulator / `http://<LAN-IP>:11434` สำหรับมือถือจริง)
- ปุ่ม Test Connection → แสดงสถานะ, latency, จำนวนโมเดล
- ปุ่ม Save
- Help text: วิธีตั้ง `OLLAMA_HOST=0.0.0.0` และ IP เครื่อง
- ปุ่ม Back

### 7.8 Model Management (Figma iPhone 17 - 8)
- Default Model: dropdown/list จาก models ที่มี
- Downloaded Models: list พร้อมขนาด, parameter size, ปุ่ม delete
- Pull New Model: input ชื่อโมเดล + ปุ่ม Pull + progress bar/status
- Save
- ปุ่ม Back

### 7.9 Additional screens (ไม่มีใน Figma — ใช้สไตล์เดียวกัน)
- Onboarding (first run): อธิบายแอป, ใส่ Base URL, Test, เลือกโมเดล, เริ่มแชท
- Search: ค้นหาชื่อแชท + เนื้อหาข้อความ
- Theme picker (bottom sheet)
- Rename chat dialog / Delete confirm dialog
- About screen
- Error/offline screen (connection lost)

## 8. Design System (อิง Figma)

### 8.1 Typography
- Display/Heading: **Inknut Antiqua SemiBold** (36/32/24)
- Body/UI: **Inter** (16/14/12)
- ใช้ Inter ใน chat bubble และ input เพื่อ readability; Inknut ใน title/ปุ่ม/section header
- Fallback: `Georgia` (serif), `System` (sans)
- **ภาษา UI: อังกฤษ** ตาม Figma (คง label เดิม เช่น "Ask ollama", "Connection Settings")
  — เอกสาร/README เป็นไทย; ถ้าต้องการ Thai UI ค่อยเพิ่ม Thai font ภายหลัง

### 8.2 Colors — Light
| Token | Value |
|---|---|
| bg | `#FFFFFF` |
| surface | `#EBEBEB` |
| surfaceAlt | `#F5F5F5` |
| control | `#D9D9D9` |
| text | `#111111` |
| textMuted | `rgba(17,17,17,0.55)` |
| border | `rgba(0,0,0,0.08)` |
| accent | `#D6F5E3` |
| accentStrong | `#5FCB93` |
| danger | `#D9534F` |
| success | `#2E9E6B` |

### 8.3 Colors — Dark
| Token | Value |
|---|---|
| bg | `#121212` |
| surface | `#1E1E1E` |
| surfaceAlt | `#262626` |
| control | `#333333` |
| text | `#F5F5F5` |
| textMuted | `rgba(245,245,245,0.60)` |
| border | `rgba(255,255,255,0.10)` |
| accent | `#244A39` |
| accentStrong | `#7ED9A8` |
| danger | `#FF6B6B` |
| success | `#5FD3A0` |

### 8.4 Spacing / Radius
- Spacing: 4, 8, 12, 16, 20, 24, 32
- Radius: pill 999, card 28, input 40, sheet 28
- Touch target ≥ 44×44
- Font scale รองรับ (ไม่ล็อก)

### 8.5 Components
`AppButton`, `AppInput`, `AppCard`, `ChatBubble`, `SettingsRow`, `Avatar`, `IconButton`,
`EmptyState`, `SectionHeader`, `Screen`, `DrawerContent`, `AttachmentChip`,
`ConnectionBadge`, `ModelRow`, `ConfirmDialog`, `PromptDialog`, `Toast`

## 9. Architecture

### 9.1 Stack
- Expo (latest stable) + React Native + TypeScript (strict)
- Expo Router (Stack + Drawer)
- Zustand (state)
- AsyncStorage (persistence)
- expo-font + bundled Inknut Antiqua / Inter TTFs
- expo-image-picker + expo-document-picker (attachments)
- expo-file-system (เก็บไฟล์แนบในเครื่อง ไม่ยัด base64 ลง AsyncStorage)
- expo-clipboard, expo-haptics
- @expo/vector-icons (Ionicons)
- react-native-markdown-display (assistant messages)
- expo/fetch (streaming NDJSON)
- Jest + jest-expo (unit tests สำหรับ parser/validation/store)

### 9.2 Folder Structure
```
OCBM/
  app/
    _layout.tsx
    index.tsx                 # redirect → onboarding หรือ chat
    onboarding.tsx
    (drawer)/
      _layout.tsx             # drawer + chat
      index.tsx               # chat
    settings/
      _layout.tsx
      index.tsx
      connection.tsx
      models.tsx
      customize.tsx
      email.tsx
      phone.tsx
      theme.tsx
      about.tsx
    search.tsx
  src/
    api/ollama.ts
    components/
    hooks/
    lib/
    store/
    theme/
    types/
  assets/fonts/
  docs/
  __tests__/
  app.json
  eas.json
  package.json
  tsconfig.json
```

### 9.3 Data Model
```ts
type Role = 'system' | 'user' | 'assistant';

type Attachment = {
  id: string;
  kind: 'image' | 'text';
  uri: string;          // local file uri ใน app documents dir
  name: string;
  mimeType: string;
  size: number;
  textContent?: string; // เฉพาะ text file, cap 100KB
};

type Message = {
  id: string;
  role: Role;
  content: string;
  attachments?: Attachment[];
  createdAt: number;
  model?: string;
  status?: 'sending' | 'streaming' | 'done' | 'error';
  error?: string;
};

type Chat = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: Message[];
};

type Profile = { name: string; email: string; phone: string };

type Settings = {
  baseUrl: string;
  defaultModel: string;
  theme: 'light' | 'dark' | 'system';
  systemPrompt: string;
  personalContext: string;
  profile: Profile;
  onboardingComplete: boolean;
};
```

### 9.4 Persistence Keys
- `ocbm:settings`
- `ocbm:chats:index` → `{ id, title, preview, createdAt, updatedAt, messageCount }[]`
- `ocbm:chat:<id>` → full `Chat`
- `ocbm:version` → schema version (future migrations)

### 9.5 State (Zustand stores)
- `useSettingsStore`: settings + load/save/update
- `useChatsStore`: chats index, active chat, CRUD, append/update messages
- `useConnectionStore`: connection status, models, test/pull progress

## 10. Ollama Integration

Base URL ตั้งค่าได้; normalize ตัด trailing slash; รองรับ http/https
- ค่าเริ่มต้น: **ว่าง** → onboarding บังคับให้กรอก (พร้อม hint `http://10.0.2.2:11434` สำหรับ emulator
  และ `http://<LAN-IP>:11434` สำหรับมือถือจริง)
- เป้าหมาย dev หลัก: **มือถือจริงผ่าน Expo Go + LAN** (เครื่องนี้ไม่มี Android SDK)
- ตรวจ URL ก่อน save; ถ้า test ไม่ผ่านยัง save ได้แต่แสดง warning

| งาน | Endpoint |
|---|---|
| ทดสอบ | `GET /api/tags` |
| รายการโมเดล | `GET /api/tags` |
| แชท | `POST /api/chat` `{ model, messages, stream:true, images? }` |
| Pull | `POST /api/pull` `{ name, stream:true }` |
| ลบ | `DELETE /api/delete` `{ name }` |
| รายละเอียดโมเดล | `POST /api/show` `{ name }` |

- Streaming: อ่าน NDJSON ทีละบรรทัด, parse `{ message: { content }, done }`
- Non-streaming fallback ถ้า `response.body` ไม่พร้อม
- Timeout: test 8s, chat 120s, pull ไม่จำกัดแต่มี cancel
- Error mapping: network / 404 model not found / 400 / 5xx / timeout → ข้อความ error ภาษาอังกฤษ + retry
- Images: base64 (ตัด data URI prefix) สูงสุด 4 รูป, ≤ 10MB/รูป
- ไฟล์แนบ: copy เข้า app documents dir, เก็บแค่ metadata ใน AsyncStorage; text file cap 100KB
- ตรวจ capabilities จาก `/api/tags` (v0.40.8 ส่ง `capabilities` มาแล้ว) และ fallback `/api/show`
  ถ้าโมเดลไม่มี `vision` → เตือนก่อนส่งรูป
- Pull progress: `{ status, completed, total }` → progress bar + ข้อความ

### Context policy
- ส่ง system prompt เสมอ (ถ้ามี)
- ส่งประวัติสูงสุด **24 ข้อความล่าสุด** และไม่เกิน **~24,000 ตัวอักษร**
- ตัดจากข้อความเก่าสุดก่อน; ถ้ายังเกินให้ตัดต่อจนพอ
- เก็บ full history ในเครื่อง แต่ส่งเฉพาะ window นี้ไป Ollama

### Android networking
- `app.json` → `android.usesCleartextTraffic: true`
- แนะนำผู้ใช้ตั้ง `OLLAMA_HOST=0.0.0.0` และ `OLLAMA_ORIGINS=*`
- Emulator ใช้ `http://10.0.2.2:11434`; เครื่องจริงใช้ `http://<LAN-IP>:11434`
- เพิ่มปุ่มคัดลอก/วาง URL และ help text

## 11. UX States

- Loading: skeleton/spinner ที่ list และ models
- Empty: chat ว่าง, ไม่มีประวัติ, ไม่มีโมเดล
- Error: inline error + retry, connection banner
- Offline: banner "เชื่อมต่อ Ollama ไม่ได้" + ปุ่มไป Settings
- Streaming: stop button, disabled send
- Pull: progress + cancel
- Delete: confirm dialog

## 12. Security & Privacy

- ข้อมูลทั้งหมดอยู่ในเครื่อง (AsyncStorage + app documents) ไม่ส่งออกนอกนอกจากไปยัง Ollama ที่ผู้ใช้ตั้ง
- ไม่เก็บ API key (Ollama local ไม่ต้องใช้)
- มี 2 ระดับ: **Clear chat history** (ลบแชทเท่านั้น) และ **Reset app** (ลบ settings + โปรไฟล์ + ไฟล์แนบทั้งหมด)
- ไม่ log เนื้อหาแชทใน production

## 13. Build & Run

- Dev: `npm install` → `npx expo start` → สแกน QR ด้วย Expo Go (Android)
- Web preview (QA): `npx expo start --web`
- Type check: `npx tsc --noEmit`
- Tests: `npm test`
- Bundle check: `npx expo export --platform android`
- APK: `eas build -p android --profile preview` (ต้องมี Expo account) หรือลง Android SDK แล้ว `npx expo run:android`
- `eas.json` เตรียม profile `development`, `preview`, `production`

## 14. Testing / Verification

- Unit tests: NDJSON parser, URL validation, email/phone validation, title generation, store reducers
- Type check strict ผ่าน
- `expo export` ผ่าน (bundle ไม่พัง)
- Visual QA: เปิด web preview + ใช้ Playwright screenshot เทียบกับ Figma (layout/spacing/สี)
- Manual: รันบน Expo Go, ทดสอบ chat streaming, stop, pull model, theme, persistence
- Acceptance criteria:
  - ส่งข้อความแล้วได้คำตอบ streaming จาก Ollama จริง
  - ปิด/เปิดแอปแล้วประวัติยังอยู่
  - เปลี่ยน theme แล้วทั้งแอปเปลี่ยน
  - Test Connection แสดงผลถูกต้อง
  - Pull model แสดง progress และรายการอัปเดต

## 15. Docs (.md)

- `README.md` — overview, features, prerequisites, Ollama setup, run, build, troubleshooting
- `docs/DESIGN.md` — design tokens, components, Figma mapping
- `docs/ARCHITECTURE.md` — structure, data flow, API, storage
- `docs/ROADMAP.md` — iOS, vision models, voice, RAG
- `docs/CHANGELOG.md` — version history
- `docs/superpowers/specs/2026-10-22-ocbm-ollama-chat-design.md` — เอกสารนี้

## 16. My Calls (defaults ที่ผมเลือกให้)

- ชื่อแอป: **OCBM** (เปลี่ยนได้ใน `app.json`)
- ไม่มี authentication จริง — โปรไฟล์เป็น local only
- **เป้าหมาย dev หลัก: มือถือจริงผ่าน Expo Go + LAN** (ไม่ใช่ emulator)
- Default Base URL: **ว่าง** → onboarding บังคับกรอก; hint emulator `10.0.2.2` และ LAN IP
- APK ต้องใช้ EAS account หรือ Android SDK — ไม่บล็อกการทำแอป (รันผ่าน Expo Go ได้ก่อน)
- Default model: ตัวแรกจาก `/api/tags` หรือ `qwen2.5:3b`
- **ภาษา UI: อังกฤษ** ตาม Figma; README/เอกสารเป็นไทย
- Chat history เก็บใน AsyncStorage แบบ per-chat; ไฟล์แนบเก็บใน app documents dir
- **Personal Intelligence** = หน้าเก็บ personal context (memory notes) ต่อท้าย system prompt
- Context ส่งสูงสุด 24 ข้อความล่าสุด / ~24k ตัวอักษร; system prompt ส่งเสมอ
- Vision: ตรวจ capabilities จาก `/api/tags` (fallback `/api/show`); v1 ทดสอบได้แค่ UI
  เพราะยังไม่มีโมเดล vision — README แนะนำ `ollama pull llava:7b` หรือโมเดล vision อื่น
- "Clear chat history" ลบแชทอย่างเดียว; "Reset app" ลบทุกอย่าง (settings + โปรไฟล์ + ไฟล์แนบ)
- ใช้ Inknut Antiqua เฉพาะ heading/button; Inter สำหรับ body/chat
- ไม่ทำ syntax highlighting ใน v1
- ไม่ทำ voice ใน v1

## 17. Milestones

1. **M1 — Foundation:** scaffold Expo, theme, fonts, components, navigation, settings store
2. **M2 — Chat:** Ollama client, streaming, chat UI, persistence, empty/error states
3. **M3 — Drawer & History:** chat list, new/rename/delete, search
4. **M4 — Settings:** profile, connection, models, customize AI, theme, clear data
5. **M5 — Attachments:** image/file picker, preview, send, vision warning
6. **M6 — QA & Docs:** tests, type check, web visual QA, README/docs, EAS config
