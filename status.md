# Project Status: OCBM

Last Updated: 2026-10-23 22:44

## 🎯 Current Objective

รักษาเวอร์ชัน 1.1.0 ให้เสถียร และทดสอบการใช้งานจริงบนมือถือ (Ollama + on-device models)

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

## 🚧 In Progress

- [ ] ทดสอบบนมือถือจริง: Ollama connection, ดาวน์โหลดโมเดล, offline chat
- [ ] เก็บ feedback เรื่องคุณภาพภาษาไทย/ความเร็วของแต่ละโมเดล

## ⏳ Pending / Todo

- [ ] พิจารณา streaming แบบ abort กลางทางสำหรับ local inference (ปัจจุบัน abort ได้หลังจบ)
- [ ] พิจารณา resume download เมื่อเน็ตหลุด
- [ ] พิจารณาเพิ่มตัวเลือกโมเดลในอนาคต (ยังต้อง ≤ 2B)
- [ ] ตรวจสอบว่าเครื่อง 32-bit จะติดตั้ง APK ไม่ได้ (ข้อจำกัดที่ตั้งใจ)

## 📝 Notes & Context

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
