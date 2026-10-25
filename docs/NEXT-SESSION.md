# OCBM — Next Session Handoff (Future Work)

> ไฟล์นี้สำหรับใส่ใน session ใหม่ เพื่อให้ AI รู้บริบทของโปรเจกต์และงานที่จะทำต่อ
> ยังไม่ได้ push ลง GitHub (remote `main` อยู่ที่ `42d5529`)

## 🧾 Project Snapshot

- Project: `OCBM - Ollama Chat Bot Mobile`
- Path: `C:\Users\fadel\OneDrive\Desktop\ai2\OCBM`
- Platform: Android only (`arm64-v8a`), no iOS/iPad
- Version: `1.4.2` (`versionCode` 8)
- GitHub repo: `https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile`
- Current branch: `future-work` (local only)
- Remote `main`: `42d55293ea35ff995b1c1746d17a4a1467432824`

## ✅ สิ่งที่ทำเสร็จแล้ว

- GitHub release `v1.4.2` + APK
- README ภาษาไทยและ link to release
- Windows helper `OCBM-Ollama-Setup.bat`
- โมเดล on-device 10 ตัวใน catalog (≤ 2B)
- Date & Time settings (custom override + timezone)
- Free web search ด้วย DuckDuckGo (toggle +  injecting results into prompt)
- Auto-update via Expo OTA + settings screen
- Chat: streaming, stop, regenerate, edit, delete, copy
- Personal Intelligence + Customize AI + profile
- Tests: 84/84 ครั้งล่าสุดที่รัน

## ⚠️ Constraints & Gotchas

- `react-native-markdown-display`: ห้ามส่ง `style` แบบ array ให้ `Markdown`; ต้องใช้ object เท่านั้น
- ต้องคง `buildArchs: ["arm64-v8a"]` และ llama variants env ใน `eas.json` เพื่อไม่ชน 45 นาที EAS Free plan
- โมเดล on-device ≤ 2B เท่านั้น
- AI Source (`Auto` / `On-device` / `PC`) ต้องเลือกได้แม้มีโมเดล on-device แล้ว
- การซ่อนโมเดล Ollama ที่ไม่รองรับ chat (`completion`) ต้องคงไว้
- `Reset app` ล้าง storage/settings/chats แต่ **ไม่ลบไฟล์โมเดลหรือไฟล์แนบ**
- `OCBM.apk` ที่ root (102 MB) เป็นไฟล์เก่า อย่าใช้แทน asset ของ v1.4.2
- EAS artifact link อาจหมดอายุ ใช้ GitHub Release หลักเมื่อส่งให้ผู้ใช้
- UI เป็นภาษาอังกฤษ แม้ README เป็นภาษาไทย

## 🎯 Current User Intent For This Branch

> เฟส 1, 2, 3 ใน future-work ทำเสร็จแล้ว:
> - Date & Time settings (อยู่ใน Settings)
> - Web Search (DuckDuckGo HTML POST, ไม่ต้อง key)
> - Auto Update (Expo OTA + หน้า Settings → App Updates)
> งานถัดไปคือ test บนเครื่องจริง, build, แล้ว merge/release ลง GitHub ตามคำขอ (เมื่อผู้ใช้สั่งเท่านั้น)

## 📁 Files Likely To Touch

- `README.md`
- `src/app/settings/*`
- `src/components/ChatBubble.tsx`
- `src/lib/modelCatalog.ts`
- `src/lib/localInference.ts`
- `status.md`

## ✍️ Task Outline (Fill In Before Running Next Session)

| # | Goal | Notes |
|---|------|-------|
| 1 | [x] Date & Time settings | commit 1f0a04e/c54ed70 |
| 2 | [x] Web Search settings + integration | commit 66f2b4d/6b7cb5f |
| 3 | [x] Auto-update (Expo OTA + App Updates screen) | commit 7448c8b + คู่ commit |
| 4 | [ ] Test จริงบนเครื่อง Android | APK/Expo Go (native updater จะไม่ทำงานใน dev) |
| 5 | [ ] EAS build / publish update / merge-release to GitHub | หลัง user ยืนยัน |

## 🧠 Prompt To Paste Into The New Session

```text
You are continuing work on OCBM at C:\Users\fadel\OneDrive\Desktop\ai2\OCBM.
Read docs/NEXT-SESSION.md first, then ask me what I want to build or fix.
Keep README and status.md updated.
Do not push to GitHub unless I explicitly ask.
The following constraints must stay true unless I say otherwise:
- Android arm64-v8a only; no iOS/iPad.
- On-device models must stay <= 2B.
- AI Source (Auto / On-device / PC) must remain selectable after downloading a model.
- Chat edit/regenerate, stop generation, context memory, and keyboard avoidance must keep working.
- EAS build must remain under the 45-minute free-tier limit.
- Do not pass React Native Markdown style as an array.
```

## 📌 When This Task Is Done

- Update this file with the exact goal that was completed.
- Update `status.md`.
- If code changed, run `npm test` and `npx tsc --noEmit`.
- Only push to GitHub if the user explicitly asks in the new session.
