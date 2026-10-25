# Project Status: OCBM

Last Updated: 2026-10-25 12:16

## 🎯 Current Objective

เผยแพร่ OCBM v1.4.2 สู่ GitHub ครบแล้ว — เหลือรับ feedback จากผู้ใช้
- Repository: https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile
- Release: https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/tag/v1.4.2

## ✅ Completed

- [x] เผยแพร่โค้ดขึ้น GitHub `main` + merge remote history (2026-10-25)
  - push local `master` → remote `main` (095a31e)
  - merge `origin/main` ด้วย `--allow-unrelated-histories`; resolve README แบบ ours
- [x] เขียน README ภาษาไทยละเอียด (2026-10-25)
  - วิธีดาวน์โหลด/ติดตั้ง, ตั้ง Ollama PC, โมเดล on-device, ฟีเจอร์ทั้งหมด, troubleshooting, privacy, dev/build
  - APK หลักชี้ที่ GitHub Release; EAS artifact เป็น mirror
- [x] สร้าง GitHub Release `v1.4.2` + อัปโหลด `OCBM-1.4.2.apk` (2026-10-25)
  - asset: 65,765,437 bytes (arm64-v8a), SHA-256 `1B4498CFD122F5A8C4B8637E872B5B797696C27F3FDD2BC9CBB968F894A20508`
  - ดาวน์โหลดจาก EAS artifact ของ v1.4.2 ไม่ใช่ `OCBM.apk` เก่าในเครื่อง
- [x] แก้ dark mode: ข้อความ assistant ใน Markdown เป็นสีดำบน bubble เข้ม (v1.4.2)
  - Root cause: `ChatBubble` ส่ง `style` เป็น array ให้ `react-native-markdown-display`
    → library อ่าน `Object.keys(style)` ได้ `"0"`, `"1"` แทน `body` → `body.color` หาย → ข้อความ fallback เป็นสีดำ
  - Fix: ส่ง plain object + ย้าย `maxWidth: '100%'` เข้า `body`
  - Regression test: `__tests__/chatBubble.test.tsx` (84 tests ผ่าน)
- [x] Build v1.4.2 (versionCode 8) สำเร็จใน 12.6 นาที
  - APK: https://expo.dev/artifacts/eas/Hji8vxXv28cWpY99nfppNfevj_Lmm1S3vrwLF-csCmw.apk
- [x] เชื่อมต่อ Ollama ผ่าน LAN (2026-10-23)
  - เปิด `OLLAMA_HOST=0.0.0.0:11434` และ `OLLAMA_ORIGINS=*` ระดับ User
  - Windows Firewall มี inbound allow สำหรับ `ollama.exe` (Public profile)
  - ทดสอบจากมือถือผ่าน browser สำเร็จ: `http://192.168.1.50:11434` → "Ollama is running"
- [x] แก้ APK เดิมเชื่อม Ollama ไม่ได้ (2026-10-23)
  - สาเหตุ: `android.usesCleartextTraffic` ไม่ใช่ field ที่ Expo รองรับ → release APK บล็อก HTTP
  - แก้ด้วย `expo-build-properties` → `android.usesCleartextTraffic: true`
- [x] แก้ EAS build ชน timeout 45 นาที (2026-10-23)
  - สาเหตุ: `llama.rn@0.13.0-rc.8` บังคับ build-from-source 7 variants + x86_64
  - แก้: `buildArchs: ["arm64-v8a"]` + `ORG_GRADLE_PROJECT_rnllamaVariants=rnllama,rnllama_v8_2_dotprod_i8mm`
  - ผล: build สำเร็จใน **20.9 นาที**
- [x] เพิ่มโมเดล on-device หลายตัว ≤ 2B + ตรวจสเปคเครื่อง (2026-10-23)
  - Qwen 2.5 0.5B, Llama 3.2 1B, Qwen 2.5 1.5B, Gemma 2 2B
  - แนะนำโมเดลตาม RAM ที่ Android รายงาน, เตือน RAM/พื้นที่ไม่พอ
  - ดาวน์โหลด/ยกเลิก/ทดสอบ/สลับ/ลบโมเดลได้
  - migrate จาก store โมเดลเดียวเดิมอัตโนมัติ
- [x] Build APK v1.1.0 (versionCode 2) สำเร็จ (2026-10-23)
  - APK: https://expo.dev/artifacts/eas/l7QAOI7nvKmHKg9JriQh2eul1I9OI2BG1JYfdyEJPOE.apk
- [x] ขยาย on-device catalog เป็น 10 โมเดล ≤2B + ตัวเลือกแหล่ง AI (2026-10-23)
  - เพิ่ม Qwen3 0.6B, Gemma 3 1B, Typhoon2 1B (ไทย), Qwen3 1.7B, SmolLM2 1.7B, DeepSeek R1 1.5B
  - เพิ่ม `aiSource: 'auto' | 'local' | 'ollama'` ให้เลือกใช้โมเดลเครื่องหรือคอมได้ตลอด
  - กรองโมเดล Ollama ที่ไม่รองรับ chat (capabilities ไม่มี `completion`) ออกจากรายการ
  - เตือนเมื่อเลือกโมเดลที่คุยไม่ได้ และ auto-fallback ไปตัวที่ใช้ได้
  - Build v1.2.0 สำเร็จใน 12.9 นาที
  - APK: https://expo.dev/artifacts/eas/aTaTJAxvIC63tV-L2OmhVTbFfT2-0A-ozhCStx0jPyk.apk
- [x] แก้ dark mode ข้อความ Markdown มองไม่เห็น (2026-10-25)
  - สาเหตุ: ส่ง `style` เป็น array ให้ `react-native-markdown-display` → `body.color` ถูกทิ้ง
  - แก้: `style={markdownStyles}` + `maxWidth: '100%'` ใน `body`; revert Plan A token lift ที่แก้ผิดจุด
  - เพิ่ม regression test `__tests__/chatBubble.test.tsx`
- [x] UX/bug fixes kritikal (2026-10-24, commit 5055049)
  - ลบ `runCompletion` ที่ถูกเรียกซ้ำ → แก้ "ตอบเสร็จแล้วรีใหม่"
  - Header โชว์โมเดลที่ใช้จริง + ระดับแหล่ง AI
  - Stop generation สำหรับ on-device (AbortController + setSending)
  - KeyboardAvoidingView ด้วย `react-native-keyboard-controller` (adjustResize)
  - Edit/Delete ข้อความผู้ใช้ + Composer banner "Editing"
  - หน้า Profile (ชื่อ/อีเมล/เบอร์)
  - on-device ส่ง context history (buildContextMessages, 8 turns / 1600 chars)
  - เวอร์ชัน 1.3.0 (versionCode 4) กำลัง build

## 🚧 In Progress

- [ ] รับ feedback ผู้ใช้จาก v1.4.2 (APK บน GitHub Release)
- [ ] ตรวจ GitHub README/release อีกครั้งหลัง raw cache อัปเดต (API และหน้าเว็บเห็นลิงก์ release แล้ว)

## ⏳ Pending / Todo

- [ ] ทดสอบสลับ Auto / On-device / PC (Ollama), ดาวน์โหลดโมเดลใหม่, offline chat บน v1.4.2
- [ ] เก็บ feedback คุณภาพภาษาไทย/ความเร็วของแต่ละโมเดล (Typhoon2 1B vs Qwen 2.5 1.5B)
- [ ] พิจารณา streaming แบบ abort กลางทางสำหรับ local inference (ปัจจุบัน abort ได้หลังจบ)
- [ ] พิจารณา resume download เมื่อเน็ตหลุด
- [ ] พิจารณาเพิ่มตัวเลือกโมเดลในอนาคต (ยังต้อง ≤ 2B)
- [ ] ตรวจสอบว่าเครื่อง 32-bit จะติดตั้ง APK ไม่ได้ (ข้อจำกัดที่ตั้งใจ)
- [ ] iOS/iPad — **ตัดออกตามคำขอผู้ใช้** (ไม่มีแผนทำตอนนี้)

## 📝 Notes & Context

- **AI Source** — `settings.aiSource`: `auto` (local ถ้ามี ไม่งั้นใช้ Ollama), `local`, `ollama`
  - เลือกได้ใน Settings → Model Management แม้ติดตั้งโมเดล on-device แล้ว
- **Catalog 10 โมเดล ≤2B** — ลำดับใน `LOCAL_MODELS` สำคัญ: ตัวสุดท้ายของแต่ละ tier คือตัวที่ถูกแนะนำ
  - tier 1 (3.5GB): Qwen3 0.6B, Qwen 2.5 0.5B
  - tier 2 (5GB): Gemma 3 1B, Llama 3.2 1B, Typhoon2 1B (ไทย)
  - tier 3 (7GB): Qwen3 1.7B, SmolLM2 1.7B, DeepSeek R1 1.5B, Qwen 2.5 1.5B
  - tier 4 (10GB): Gemma 2 2B
- **Thinking models** — Qwen3 / DeepSeek R1 ส่ง `enable_thinking: false` ใน `generateLocal` เพื่อลด reasoning ที่ไม่จำเป็น
- **Keyboard** — `react-native-keyboard-controller` 1.22.7 (Expo bundled) + `KeyboardProvider` + adjustResize - **Stop local** — ส่ง `AbortSignal` ให้ `generateLocal` → เรียก `ctx.stopCompletion()` ทันทีเมื่อ aborted
- **react-native-markdown-display** — ห้ามส่ง `style` เป็น array; ต้องเป็น object เท่านั้น ไม่งั้น `body.color`/theme ทั้งหมดจะถูก ignore (ข้อความดำใน dark mode)
- **ห้ามเลือกโมเดลที่ไม่รองรับ chat** — Ollama 0.40.9 คืน `capabilities` ใน `/api/tags`
  - `tev1:0.8b` = `decision` → เรียก `/api/chat` ได้ 400 `"does not support chat"`
  - ใช้ได้: `qwen2.5:3b` (`completion,tools`), `qwen3:1.7b` (`completion,tools,thinking`)
- **EAS Free plan timeout = 45 นาที** — ต้องคงการจำกัด ABI/variants ไว้ ห้ามลบ `ORG_GRADLE_PROJECT_rnllamaVariants` จาก `eas.json`
- **llama.rn 0.13.0-rc.8** ตั้ง `rnllamaBuildFromSource=true` ใน `node_modules/llama.rn/android/gradle.properties` (ห้ามใช้ prebuilt เพราะ stale)
- APK เป็น **arm64-v8a เท่านั้น**
- Build command: `eas build --platform android --profile preview --non-interactive`
- Ollama PC: `http://192.168.1.50:11434` (IP เป็น DHCP อาจเปลี่ยน)
- ไฟล์สำคัญ:
  - `src/lib/modelCatalog.ts` — catalog + recommendation logic
  - `src/store/localModelStore.ts` — installed/active/downloads + migration v2
  - `src/lib/modelDownload.ts` — download/cancel/delete/reconcile
  - `src/lib/localInference.ts` — llama.rn context + generate
  - `src/app/settings/local-model.tsx` — หน้าจอ On-device AI
- Tests: `npm test` (15 suites / 84 tests), `npx tsc --noEmit`, `npx expo-doctor` (20/20)
- **GitHub** — https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile
  - local branch `master` push ไป remote `main`; คำสั่ง: `git push origin master:main`
  - remote `main` ล่าสุด: `095a31e` (README release link)
  - Release `v1.4.2`: https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/tag/v1.4.2
  - asset: `OCBM-1.4.2.apk` (65,765,437 bytes)
- **README** — ภาษาไทย, ครอบคลุมติดตั้ง/ตั้งค่า/ฟีเจอร์/troubleshooting/ข้อจำกัด/developer build
  - ลิงก์ APK หลัก = GitHub Release; EAS artifact เป็น mirror (อาจหมดอายุ)
  - อย่าเปลี่ยน `style` ของ `react-native-markdown-display` เป็น array
- **Reset app** — ล้าง AsyncStorage + settings/chats แต่ **ไม่ลบไฟล์โมเดลหรือไฟล์แนบ**; README ระบุข้อจำกัดนี้แล้ว
- `OCBM.apk` ที่ root (102 MB, 2026-10-23) เป็นไฟล์เก่าและถูก ignore; ห้ามใช้แทน asset v1.4.2
