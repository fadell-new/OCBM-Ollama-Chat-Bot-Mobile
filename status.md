# Project Status: OCBM

Last Updated: 2026-10-23 23:01

## 🎯 Current Objective

ทดสอบเวอร์ชัน 1.2.0 บนมือถือ (10 โมเดล on-device + เลือกแหล่ง AI ได้)

## ✅ Completed

- [x] เชื่อมต่อ Ollama ผ่าน LAN (2026-10-23)
  - เปิด `OLLAMA_HOST=0.0.0.0:11434` และ `OLLAMA_ORIGINS=*` ระดับ User
  - Windows Firewall มี inbound allow สำหรับ `ollama.exe` (Public profile)
  - ทดสอบจากมือถือผ่าน browser สำเร็จ: `http://192.168.1.154:11434` → "Ollama is running"
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
  - เวอร์ชัน 1.2.0 (versionCode 3) กำลัง build

## 🚧 In Progress

- [ ] ทดสอบ v1.2.0 บนมือถือ: สลับ Auto / On-device / PC (Ollama), ดาวน์โหลดโมเดลใหม่, offline chat
- [ ] เก็บ feedback คุณภาพภาษาไทย/ความเร็วของแต่ละโมเดล (Typhoon2 1B vs Qwen 2.5 1.5B)

## ⏳ Pending / Todo

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
- **ห้ามเลือกโมเดลที่ไม่รองรับ chat** — Ollama 0.40.9 คืน `capabilities` ใน `/api/tags`
  - `tev1:0.8b` = `decision` → เรียก `/api/chat` ได้ 400 `"does not support chat"`
  - ใช้ได้: `qwen2.5:3b` (`completion,tools`), `qwen3:1.7b` (`completion,tools,thinking`)
- **EAS Free plan timeout = 45 นาที** — ต้องคงการจำกัด ABI/variants ไว้ ห้ามลบ `ORG_GRADLE_PROJECT_rnllamaVariants` จาก `eas.json`
- **llama.rn 0.13.0-rc.8** ตั้ง `rnllamaBuildFromSource=true` ใน `node_modules/llama.rn/android/gradle.properties` (ห้ามใช้ prebuilt เพราะ stale)
- APK เป็น **arm64-v8a เท่านั้น**
- Build command: `eas build --platform android --profile preview --non-interactive`
- Ollama PC: `http://192.168.1.154:11434` (IP เป็น DHCP อาจเปลี่ยน)
- ไฟล์สำคัญ:
  - `src/lib/modelCatalog.ts` — catalog + recommendation logic
  - `src/store/localModelStore.ts` — installed/active/downloads + migration v2
  - `src/lib/modelDownload.ts` — download/cancel/delete/reconcile
  - `src/lib/localInference.ts` — llama.rn context + generate
  - `src/app/settings/local-model.tsx` — หน้าจอ On-device AI
- Tests: `npm test` (15 suites / 83 tests), `npx tsc --noEmit`, `npx expo-doctor` (20/20)
