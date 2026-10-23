# Multi-Model On-Device AI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ให้แอปมีโมเดล on-device หลายตัว (≤ 2B), ตรวจสเปคเครื่อง และแนะนำโมเดลที่เหมาะสม พร้อมสลับ/ดาวน์โหลด/ลบได้

**Architecture:** แยก model catalog (ข้อมูลโมเดล + ตรรกะแนะนำ) ออกจาก store (สถานะติดตั้ง/ดาวน์โหลด) และ layer ดาวน์โหลด/inference เดิม โดยเก็บไฟล์ GGUF หลายไฟล์ใน `documentDirectory/models/` และมี `activeModelId` ตัวเดียว

**Tech Stack:** Expo SDK 58, React Native, llama.rn (llama.cpp), Zustand + AsyncStorage, expo-device, expo-file-system

**Spec:** ผู้ใช้กำหนด: model on-device สูงสุด 2B, เพิ่มหลายโมเดล, ตรวจสเปคและแนะนำ

## Global Constraints

- โมเดล on-device ต้องมีขนาดพารามิเตอร์ ≤ 2B
- APK build เฉพาะ `arm64-v8a`
- ต้องผ่าน `npx tsc --noEmit`, `npm test`, และ `npx expo-doctor` 20/20
- ห้ามเปลี่ยนพฤติกรรม Ollama: ถ้าไม่มีโมเดล on-device ที่ติดตั้ง แอปต้องใช้ Ollama

## Review Focus

- เครื่อง RAM น้อย (2–3 GB) ต้องไม่แนะนำโมเดลใหญ่จนโหลดไม่ขึ้น
- พื้นที่เก็บข้อมูลไม่พอ ต้องเตือนก่อนดาวน์โหลด ไม่ปล่อยให้โหลดค้าง
- ผู้ใช้ลบไฟล์โมเดลผ่านระบบภายนอก ต้องไม่ทำให้แอป crash
- อัปเกรดจากแอปเวอร์ชันเดิม (โมเดลเดียว) ต้องไม่ต้องโหลดซ้ำ
- สลับโมเดลระหว่างใช้งาน ต้อง unload context เก่าก่อน

---

### Task 1: Model catalog + recommendation

**Files:**
- Create: `src/lib/modelCatalog.ts`
- Test: `__tests__/modelCatalog.test.ts`

**Interfaces:**
- Produces: `type DeviceModel`, `LOCAL_MODELS: DeviceModel[]`, `recommendModel(totalMemoryBytes: number | null): DeviceModel`, `getModelById(id: string): DeviceModel | undefined`, `RAM_TIERS`

- [ ] Step 1: เขียน test ครอบ recommendation 4 กรณี (4GB → qwen 0.5B, 6GB → llama 1B, 8GB → qwen 1.5B, 12GB → gemma 2B) และ guard `null` → qwen 0.5B
- [ ] Step 2: รัน `npm test -- modelCatalog` ให้ fail ก่อน
- [ ] Step 3: implement catalog 4 โมเดล (Qwen 0.5B 491400032 B, Llama 3.2 1B 807694368 B, Qwen 1.5B 1117320736 B, Gemma 2 2B 1708582752 B) พร้อม url/stopTokens/minRam
- [ ] Step 4: รัน test ให้ผ่าน
- [ ] Step 5: commit

### Task 2: Multi-model store + migration

**Files:**
- Modify: `src/store/localModelStore.ts`

**Interfaces:**
- Produces: `installed: Record<string, { path: string; downloadedAt: number }>`, `activeModelId: string | null`, `downloads: Record<string, { status; progress; error }>`, `setInstalled`, `setActive`, `removeInstalled`, `startDownload`, `setProgress`, `setDownloadError`, `clearDownload`, `setLastError`
- Consumes: `LOCAL_MODELS` ids

- [ ] Step 1: เขียน store ใหม่แบบ persist version 2, partialize เฉพาะ `installed`/`activeModelId`
- [ ] Step 2: migrate จาก shape เดิม (`status/path/downloadedAt`) → `installed['qwen2.5-0.5b']`
- [ ] Step 3: `npm test` ยังผ่าน (ไม่มี test ตรง store)
- [ ] Step 4: commit

### Task 3: Download manager

**Files:**
- Modify: `src/lib/modelDownload.ts`

**Interfaces:**
- Produces: `downloadModel(id, onProgress?)`, `cancelDownload(id)`, `deleteModel(id)`, `reconcileInstalledModels()`, `getModelPath(model)`, `getFreeStorageAsync()`
- Consumes: store actions, `LOCAL_MODELS`

- [ ] Step 1: แทนที่ฟังก์ชันโมเดลเดียวด้วย multi-model (Map ของ DownloadResumable สำหรับ cancel)
- [ ] Step 2: ลบไฟล์บางส่วนเมื่อ error/cancel, ตั้ง active อัตโนมัติเมื่อยังไม่มี active
- [ ] Step 3: `reconcileInstalledModels()` ลบ record ที่ไฟล์หาย และเลือก active ใหม่
- [ ] Step 4: `npx tsc --noEmit` ผ่าน
- [ ] Step 5: commit

### Task 4: Inference ใช้โมเดล active

**Files:**
- Modify: `src/lib/localInference.ts`

**Interfaces:**
- Produces: `isLocalModelReady()`, `loadLocalModel()`, `unloadLocalModel()`, `generateLocal({ prompt, onToken, signal? })`
- Consumes: store `activeModelId`/`installed`, catalog stopTokens

- [ ] Step 1: เลือก path จาก active model (fallback ตัวที่ติดตั้งตัวแรก)
- [ ] Step 2: ใช้ stop tokens ตามโมเดล, unload เมื่อ path เปลี่ยน
- [ ] Step 3: เก็บ error ลง `lastError`
- [ ] Step 4: `npx tsc --noEmit`
- [ ] Step 5: commit

### Task 5: หน้าจอ On-device AI + device detection

**Files:**
- Modify: `src/app/settings/local-model.tsx`

**Interfaces:**
- Consumes: catalog, store, download manager, expo-device (`totalMemory`, `supportedCpuArchitectures`, `modelName`), `getFreeStorageAsync`

- [ ] Step 1: แสดงการ์ดสเปคเครื่อง (รุ่น, RAM, arch, พื้นที่ว่าง)
- [ ] Step 2: แสดงโมเดลที่แนะนำพร้อมเหตุผล
- [ ] Step 3: list โมเดล 4 ตัว: ดาวน์โหลด/ยกเลิก/progress/ใช้งาน/ทดสอบ/ลบ
- [ ] Step 4: เตือนพื้นที่ไม่พอ (ขนาดไฟล์ + 300MB buffer)
- [ ] Step 5: `npx tsc --noEmit`
- [ ] Step 6: commit

### Task 6: Settings row + chat gating

**Files:**
- Modify: `src/app/settings/index.tsx`
- Modify: `src/app/(drawer)/index.tsx`

**Interfaces:**
- Consumes: store `activeModelId` + `installed`

- [ ] Step 1: แถว On-device AI แสดงชื่อโมเดล active หรือ "Not downloaded"
- [ ] Step 2: `localModelReady` เช็ค active + installed (แทน `status === 'ready'`)
- [ ] Step 3: `npx tsc --noEmit`
- [ ] Step 4: commit

### Task 7: Verify + build

- [ ] Step 1: `npx tsc --noEmit`
- [ ] Step 2: `npm test -- --runInBand`
- [ ] Step 3: `npx expo-doctor`
- [ ] Step 4: `npx expo prebuild --platform android --no-install --clean` แล้วตรวจ `reactNativeArchitectures=arm64-v8a` + `usesCleartextTraffic` — ลบ `android/` หลังตรวจ
- [ ] Step 5: commit
- [ ] Step 6: ยกเลิก build เก่าที่ยัง queue (ถ้ามี) และเริ่ม EAS build ใหม่
