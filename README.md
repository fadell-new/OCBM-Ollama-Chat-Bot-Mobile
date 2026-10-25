# OCBM — Ollama Chat Bot Mobile

**แอปแชท AI ส่วนตัวสำหรับ Android** ที่คุณเลือกได้ว่าจะคุยกับโมเดลบนมือถือ หรือต่อกับ Ollama ที่รันอยู่บนคอมพิวเตอร์ของคุณ

![Android](https://img.shields.io/badge/Android-arm64--v8a-3DDC84?logo=android&logoColor=white)
![Version](https://img.shields.io/badge/version-1.5.1-blue)
![Expo](https://img.shields.io/badge/Expo-SDK%2058-000020?logo=expo&logoColor=white)

> **เวอร์ชันล่าสุด: 1.5.1 (versionCode 10)**
>
> **[⬇ ดาวน์โหลด APK สำหรับ Android](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/download/v1.5.1/OCBM-1.5.1.apk)**
>
> [ดู Release v1.5.1](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/tag/v1.5.1) · [EAS mirror](https://expo.dev/artifacts/eas/bcKjhWFPo73MZ4j5dnaUJuYRXDKt3ZhJEI5IwVkdRSM.apk)

OCBM ย่อมาจาก **Ollama Chat Bot Mobile** เป็นแอปแชทที่ออกแบบมาให้ทำงานร่วมกับ AI ของคุณเอง ไม่มีบัญชี ไม่มีคลาวด์ และไม่มีโฆษณา คุณสามารถใช้ Ollama บนคอมผ่าน Wi-Fi หรือดาวน์โหลดโมเดลขนาดเล็ก (ไม่เกิน 2B พารามิเตอร์) มาเก็บไว้ในมือถือเพื่อแชทแบบออฟไลน์ได้

---

## สารบัญ

- [OCBM คืออะไร](#ocbm-คืออะไร)
- [เลือกวิธีใช้งาน](#เลือกวิธีใช้งาน)
- [ดาวน์โหลดและติดตั้ง](#ดาวน์โหลดและติดตั้ง)
- [เปิดแอปครั้งแรก (Onboarding)](#เปิดแอปครั้งแรก-onboarding)
- [วิธีที่ 1: ใช้ Ollama บนคอม (PC)](#วิธีที่-1-ใช้-ollama-บนคอม-pc)
- [วิธีที่ 2: ใช้โมเดลบนมือถือ (On-device)](#วิธีที่-2-ใช้โมเดลบนมือถือ-on-device)
- [ฟีเจอร์และวิธีใช้โดยละเอียด](#ฟีเจอร์และวิธีใช้โดยละเอียด)
- [แผนที่หน้าตั้งค่า](#แผนที่หน้าตั้งค่า)
- [แก้ปัญหา](#แก้ปัญหา)
- [ความเป็นส่วนตัว](#ความเป็นส่วนตัว)
- [ข้อจำกัดที่ควรรู้](#ข้อจำกัดที่ควรรู้)
- [สำหรับนักพัฒนา](#สำหรับนักพัฒนา)
- [เวอร์ชันและเอกสาร](#เวอร์ชันและเอกสาร)

---

## OCBM คืออะไร

OCBM เป็นแอปแชท AI ที่ทำหน้าที่เป็นหน้าจอคุยกับโมเดลภาษา โดยแยก "สมอง" ออกเป็น 2 แบบ

1. **PC (Ollama)** — ใช้โมเดลที่รันบนคอมพิวเตอร์ของคุณผ่าน Ollama เหมาะกับเครื่องแรงที่อยากได้โมเดลใหญ่ คุณภาพสูง และตอบเร็ว
2. **On-device** — ดาวน์โหลดโมเดล GGUF ขนาดเล็กมาไว้ในมือถือ ใช้ `llama.cpp` ผ่าน `llama.rn` ประมวลผลบนเครื่องทั้งหมด ใช้ได้แม้ไม่มีอินเทอร์เน็ต

ทั้งสองแบบใช้หน้าจอแชทเดียวกัน เปลี่ยนไปมาได้ตลอดเวลา และเลือกโหมด **Auto** ให้แอปตัดสินใจให้ก็ได้

### จุดเด่น

- **Private by default** — บทสนทนาและโปรไฟล์เก็บในเครื่อง ไม่มีระบบสมัครสมาชิกและไม่มีการส่งข้อมูลไปยังเซิร์ฟเวอร์ของแอป
- **เลือกแหล่ง AI ได้ตลอดเวลา** — `Auto` / `On-device` / `PC (Ollama)` แม้ดาวน์โหลดโมเดลบนเครื่องแล้วก็ยังสลับกลับไปใช้คอมได้
- **โมเดลบนเครื่อง 10 ตัว** — ทุกตัวมีขนาดไม่เกิน 2B พร้อมระบบแนะนำตาม RAM และตรวจพื้นที่ว่างก่อนดาวน์โหลด
- **แชทแบบ streaming** — ข้อความไหลออกมาทีละคำ หยุดกลางทางได้ และบันทึกข้อความที่ได้ไว้
- **จัดการข้อความได้จริง** — คัดลอก, แก้ไขข้อความที่ส่งไป, ลบ, และ regenerate คำตอบ
- **Markdown** — แสดงหัวข้อ รายการ ตาราง และบล็อกโค้ดในคำตอบ
- **ไฟล์แนบ** — ส่งรูปภาพให้โมเดล vision บน PC หรือแนบไฟล์ข้อความ/JSON ให้ AI อ่าน
- **Personal Intelligence** — จำข้อมูลส่วนตัวและคำสั่งประจำของคุณด้วย system prompt ที่ปรับได้
- **ค้นหาประวัติ** — ค้นหาจากชื่อแชทและเนื้อหาข้อความ พร้อมไฮไลต์คำที่เจอ
- **ธีม Light / Dark / System** — พร้อมแก้ปัญหา contrast ในโหมดมืดตั้งแต่เวอร์ชัน 1.4.2
- **รองรับคีย์บอร์ด** — ช่องพิมพ์ไม่ถูกคีย์บอร์ดบัง และปรับขนาดหน้าจออัตโนมัติ

---

## เลือกวิธีใช้งาน

| | PC (Ollama) | On-device |
|---|---|---|
| **ต้องมีคอมเปิดอยู่** | ใช่ | ไม่ต้อง |
| **ต้องใช้อินเทอร์เน็ต** | ต้องอยู่ใน Wi-Fi เดียวกัน | ใช้แชทได้แบบออฟไลน์ |
| **คุณภาพคำตอบ** | สูงกว่า เลือกโมเดลใหญ่ได้ | จำกัดที่ ≤ 2B |
| **ความเร็ว** | ขึ้นกับสเปคคอม | ขึ้นกับ RAM/CPU ของมือถือ |
| **อ่านรูปภาพ** | ได้ (ถ้าโมเดลรองรับ vision) | ไม่ได้ (ข้อความเท่านั้น) |
| **ติดตั้งยาก** | ต้องตั้ง Ollama + firewall | ดาวน์โหลดโมเดลในแอป |
| **เหมาะกับ** | ใช้งานประจำที่บ้าน/ออฟฟิศ | พกไปไหนมาไหน ใช้นอกบ้าน |

> แนะนำให้เริ่มจาก **PC (Ollama)** ถ้ามีคอมที่แรงพอ เพราะตั้งค่าง่ายและได้คุณภาพที่ดีกว่า จากนั้นค่อยลองโมเดลบนเครื่องเมื่อต้องการใช้งานออฟไลน์

---

## ดาวน์โหลดและติดตั้ง

### สิ่งที่ต้องมี

- มือถือหรือแท็บเล็ต **Android สถาปัตยกรรม arm64-v8a** (อุปกรณ์ส่วนใหญ่ที่วางจำหน่ายตั้งแต่ราวปี 2017)
- พื้นที่ว่างสำหรับติดตั้งแอปอย่างน้อย **500 MB**
- หากจะใช้โมเดลบนเครื่อง เผื่อพื้นที่เพิ่มอีก **0.4–1.7 GB ต่อโมเดล** (แอปจะกันพื้นที่ buffer ไว้ประมาณ 300 MB)
- แอปนี้ **ไม่รองรับ iOS/iPadOS** และ **ไม่รองรับ Android 32-bit หรือ emulator x86**

### ขั้นตอนติดตั้ง

1. เปิดลิงก์นี้บนมือถือ: **[ดาวน์โหลด OCBM v1.5.0](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/download/v1.5.0/OCBM-1.5.1.apk)**
   - ถ้าลิงก์ GitHub ใช้งานไม่ได้ ให้ใช้ [EAS mirror](https://expo.dev/artifacts/eas/bcKjhWFPo73MZ4j5dnaUJuYRXDKt3ZhJEI5IwVkdRSM.apk)
2. รอไฟล์ `OCBM-1.5.1.apk` ดาวน์โหลดเสร็จ (ขนาดประมาณ 66 MB)
3. เปิดไฟล์ APK ที่ดาวน์โหลดมา
4. หาก Android ถามว่าไม่อนุญาตให้ติดตั้ง ให้ไปที่ **Settings → Allow from this source** หรือ **Install unknown apps** แล้วเปิดสิทธิ์ให้แอปที่ใช้เปิดไฟล์ (Chrome/Files)
5. หากมีหน้าต่าง **Play Protect** เตือนว่าไม่รู้จักแอป ให้เลือก **More details → Install anyway** (นี่เป็น internal build ที่ไม่ได้เผยแพร่ผ่าน Play Store)
6. กด **Install** แล้วเปิดแอป

### อัปเดตเวอร์ชันใหม่

ติดตั้งทับเวอร์ชันเดิมได้เลย ข้อมูลแชทและโมเดลที่ดาวน์โหลดไว้จะยังอยู่ หาก Android ขึ้นว่า **App not installed** ให้ถอนการติดตั้งเวอร์ชันเก่าก่อน (ข้อมูลจะหาย) แล้วติดตั้งใหม่

> APK นี้เป็น **preview/internal build** เซ็นด้วย keystore ของโปรเจกต์ ไม่ได้ผ่านการตรวจของ Play Store จึงอาจมีคำเตือนจากระบบ และไม่ควรใช้เป็นช่องทางแจกจ่ายสาธารณะใน production

---

## เปิดแอปครั้งแรก (Onboarding)

เมื่อเปิดแอปครั้งแรกจะเห็นหน้าจอต้อนรับ 3 ขั้นตอน

1. **Welcome** — กด **Get started**
2. **Connection** — ใส่ที่อยู่ Ollama ของคอม แล้วกด **Test Connection**
   - ถ้าคอมกับมือถืออยู่ Wi-Fi เดียวกัน สามารถกด **Find Ollama on this network** ให้แอปสแกนหาเองได้
   - ถ้ายังไม่มีคอมให้ต่อ ให้กด **Skip** ไปก่อน
3. **Model** — เลือกโมเดลที่จะใช้เป็นค่าเริ่มต้น
   - ถ้าคอมยังไม่มีโมเดล กด **Pull qwen2.5:3b** เพื่อดาวน์โหลดโมเดลเล็กที่ใช้งานได้ทันที
   - หรือกด **Finish** เพื่อไปตั้งค่าภายหลัง

### ถ้าจะใช้โมเดลบนมือถืออย่างเดียว

1. กด **Get started**
2. ที่ขั้น Connection กด **Skip**
3. ที่ขั้น Model กด **Finish**
4. เปิดเมนูด้านซ้าย (ไอคอนแฮมเบอร์เกอร์) → **Settings** → **On-device AI**
5. ดาวน์โหลดโมเดลที่ต้องการ แล้วกด **Use this model**
6. กลับไปหน้าแชทแล้วเริ่มคุยได้เลย

> หลังตั้งค่าเสร็จ แอปจะจำค่าไว้ ไม่ต้องทำ onboarding ซ้ำ ยกเว้นกด **Reset app** ในหน้า About

---

## วิธีที่ 1: ใช้ Ollama บนคอม (PC)

### 1. ติดตั้ง Ollama

ดาวน์โหลดและติดตั้งจาก [ollama.com/download](https://ollama.com/download) รองรับ Windows, macOS และ Linux

ตรวจสอบว่าคำสั่ง `ollama` ใช้ได้:

```bash
ollama --version
```

### 2. ดาวน์โหลดโมเดลสำหรับแชท

```bash
ollama pull qwen2.5:3b
```

โมเดลอื่นที่ใช้ได้ เช่น `llama3.2:3b`, `qwen2.5:7b`, `llama3.1:8b` หรือโมเดล vision อย่าง `llava` — ใช้โมเดลไหนก็ได้ที่ Ollama รองรับ `/api/chat`

> OCBM จะซ่อนโมเดลที่ไม่รองรับการแชท (ไม่มี capability `completion`) ออกจากรายการเลือกโมเดลโดยอัตโนมัติ

### 3. เปิดให้มือถือเข้าถึง Ollama ได้

โดยค่าเริ่มต้น Ollama รับเฉพาะ connection จากเครื่องตัวเอง (127.0.0.1) ต้องเปิดให้ฟังบน network ด้วย

#### Windows (PowerShell)

```powershell
setx OLLAMA_HOST "0.0.0.0:11434"
setx OLLAMA_ORIGINS "*"
```

จากนั้น **quit Ollama จาก system tray แล้วเปิดใหม่** (หรือรีสตาร์ทเครื่อง) เพื่อให้ตัวแปรมีผล

เปิด firewall สำหรับพอร์ต 11434 (รัน PowerShell แบบ Administrator):

```powershell
New-NetFirewallRule -DisplayName "Ollama 11434" -Direction Inbound -Protocol TCP -LocalPort 11434 -Action Allow
```

#### ทางลัดสำหรับ Windows: ใช้ไฟล์ `.bat`

ถ้าไม่อยากพิมพ์คำสั่งเอง ให้ดาวน์โหลด **[OCBM-Ollama-Setup.bat](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases/download/v1.5.1/OCBM-Ollama-Setup.bat)** แล้วดับเบิลคลิกไฟล์นั้น ([ดูโค้ด](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/blob/main/OCBM-Ollama-Setup.bat))

ไฟล์นี้จะทำให้อัตโนมัติ:

- ตั้งค่า `OLLAMA_HOST=0.0.0.0:11434` และ `OLLAMA_ORIGINS=*`
- เปิดพอร์ต TCP `11434` ใน Windows Firewall
- รีสตาร์ท Ollama เพื่อให้อ่านค่าใหม่
- แสดง IP และ URL สำหรับเชื่อมต่อจากมือถือ พร้อมคัดลอก IP ไปยัง clipboard

ต้องกด **Yes** ในหน้าต่างขอสิทธิ์ Administrator (ไฟล์จะขอเอง) และใช้ได้กับ Windows เท่านั้น

> หลังรันเสร็จ เปิดเบราว์เซอร์ในมือถือไปที่ URL ที่แสดง ถ้าเห็น **Ollama is running** แสดงว่าพร้อมใช้งาน

#### macOS

```bash
launchctl setenv OLLAMA_HOST "0.0.0.0:11434"
launchctl setenv OLLAMA_ORIGINS "*"
```

แล้ว quit Ollama app จาก menu bar และเปิดใหม่

หรือรันใน terminal โดยตรง:

```bash
OLLAMA_HOST=0.0.0.0:11434 OLLAMA_ORIGINS='*' ollama serve
```

#### Linux (systemd)

```bash
sudo systemctl edit ollama.service
```

ใส่ค่าต่อไปนี้ใน editor:

```ini
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_ORIGINS=*"
```

บันทึกแล้วโหลดค่าใหม่:

```bash
sudo systemctl daemon-reload
sudo systemctl restart ollama
sudo ufw allow 11434/tcp
```

### 4. หา IP ของคอม

- **Windows:** `ipconfig` → ดู **IPv4 Address** เช่น `192.168.1.50`
- **macOS:** `ipconfig getifaddr en0`
- **Linux:** `hostname -I`

มือถือและคอมต้องอยู่ **Wi-Fi เดียวกัน** และไม่ใช่ guest network ที่ปิดการคุยกันระหว่างอุปกรณ์

### 5. ทดสอบจากมือถือ

เปิดเบราว์เซอร์ในมือถือไปที่:

```text
http://<IP-ของคอม>:11434
```

ถ้าเห็นข้อความ **Ollama is running** แสดงว่ามือถือเข้าถึงได้แล้ว

ตัวอย่าง:

```text
http://192.168.1.50:11434
```

> ใช้ `http://` ไม่ใช่ `https://` และไม่ต้องใส่ `/api` ต่อท้าย

### 6. เชื่อมต่อในแอป

1. ไปที่ **Settings → Connection Settings**
2. ใส่ **Base URL** เช่น `http://192.168.1.50:11434`
3. กด **Test Connection** — จะเห็นสถานะ Online, latency และจำนวนโมเดล
4. กด **Save**
5. ไปที่ **Settings → Model Management** เลือก **AI Source = PC** และเลือกโมเดลเริ่มต้น
6. กลับไปหน้าแชท

### 7. ถ้า IP เปลี่ยน

เราเตอร์มักแจก IP แบบ DHCP ทำให้ที่อยู่เปลี่ยนหลังรีสตาร์ท หากแอปเชื่อมต่อไม่ได้:

- กด **Find Ollama on this network** ในหน้า Connection Settings อีกครั้ง
- หรือตั้ง **DHCP reservation / static IP** ให้คอมในเราเตอร์
- ตรวจว่า VPN ในมือถือไม่ได้บังคับ traffic ออกนอกวง LAN

---

## วิธีที่ 2: ใช้โมเดลบนมือถือ (On-device)

โมเดลบนเครื่องจะถูกดาวน์โหลดจาก Hugging Face เป็นไฟล์ GGUF แบบ Q4_K_M และรันด้วย `llama.cpp` ภายในแอป

### สเปคที่ต้องมี

- Android arm64-v8a
- RAM รวมตามที่ระบุในตาราง (เป็น RAM ทั้งเครื่อง ไม่ใช่ RAM ที่ว่าง)
- พื้นที่ว่างพอสำหรับไฟล์โมเดล + buffer ประมาณ 300 MB

แอปจะอ่าน RAM และพื้นที่ว่างของเครื่อง แสดงโมเดลที่แนะนำ และเตือนหากพื้นที่ไม่พอ

### ขั้นตอนดาวน์โหลดและใช้งาน

1. เปิด **Settings → On-device AI**
2. ดูการ์ด **This device** เพื่อตรวจ RAM, CPU และพื้นที่ว่าง
3. ดู **Recommended for this device** เพื่อดูโมเดลที่เหมาะกับเครื่อง
4. กด **Download** ที่โมเดลที่ต้องการ (แนะนำให้ใช้ Wi-Fi)
5. รอจนดาวน์โหลดเสร็จ — ระหว่างนั้นกด **Cancel download** ได้
6. กด **Use this model** เพื่อตั้งเป็นโมเดลปัจจุบัน (แอปจะสลับ AI Source เป็น On-device ให้)
7. กด **Test** เพื่อทดลองสร้างข้อความสั้น ๆ ตรวจว่าโมเดลโหลดได้
8. กลับไปหน้าแชท

### ตารางโมเดลบนเครื่อง (ทั้งหมด ≤ 2B)

| โมเดล | Params | ขนาดดาวน์โหลด | RAM ขั้นต่ำ | RAM แนะนำ | ภาษา | จุดเด่น |
|---|---:|---:|---:|---:|---|---|
| Qwen3 0.6B | 0.6B | ~378 MB | 3 GB | 3.5 GB | ไทย / อังกฤษ | เล็กมาก เปิดได้ทุกเครื่อง |
| Qwen 2.5 0.5B | 0.5B | ~469 MB | 3 GB | 3.5 GB | ไทย / อังกฤษ | เบาที่สุด ตอบไว |
| Gemma 3 1B | 1B | ~769 MB | 4 GB | 5 GB | หลายภาษา | หลายภาษา ภาษาไทยใช้ได้ |
| Llama 3.2 1B | 1B | ~770 MB | 4 GB | 5 GB | อังกฤษเป็นหลัก | เร็ว ภาษาอังกฤษดี |
| Typhoon2 1B (Thai) | 1B | ~770 MB | 4 GB | 5 GB | ไทยเป็นหลัก | เทรนภาษาไทยโดยเฉพาะ |
| Qwen3 1.7B | 1.7B | ~1.03 GB | 6 GB | 7 GB | ไทย / อังกฤษ | Thinking model ใช้เหตุผลดีขึ้น |
| SmolLM2 1.7B | 1.7B | ~1.0 GB | 6 GB | 7 GB | อังกฤษเป็นหลัก | กะทัดรัด ตอบไว |
| DeepSeek R1 1.5B | 1.5B | ~1.1 GB | 6 GB | 7 GB | อังกฤษ / จีน | Reasoning model แสดงการคิดก่อนตอบ |
| Qwen 2.5 1.5B | 1.5B | ~1.1 GB | 6 GB | 7 GB | ไทย / อังกฤษ | สมดุลดี ภาษาไทยดีที่สุด |
| Gemma 2 2B | 2B | ~1.7 GB | 8 GB | 10 GB | หลายภาษา | คุณภาพสูงสุดในกลุ่ม ≤ 2B |

> แอปจะแนะนำโมเดลคุณภาพสูงสุดใน tier ที่ RAM เครื่องรับไหว โดยเรียงจาก Qwen 2.5 0.5B → Typhoon2 1B → Qwen 2.5 1.5B → Gemma 2 2B ตาม RAM 3.5 / 5 / 7 / 10 GB
>
> โมเดล Qwen3 และ DeepSeek R1 เป็น thinking model แต่แอปปิด thinking ไว้เพื่อลดการตอบ reasoning ที่ไม่จำเป็น

### ข้อควรรู้เกี่ยวกับโมเดลบนเครื่อง

- **ดาวน์โหลดไม่สามารถ resume ได้** หากเน็ตหลุดหรือกดยกเลิก ต้องเริ่มใหม่จาก 0
- ดาวน์โหลดหลายโมเดลเก็บไว้พร้อมกันได้ แล้วสลับด้วย **Use this model**
- ลบโมเดลได้ที่ปุ่ม **Delete** ในหน้า On-device AI (ไฟล์จะถูกลบออกจากเครื่อง)
- โมเดลบนเครื่อง **อ่านรูปภาพไม่ได้** ใช้ได้เฉพาะข้อความ
- บริบทบนเครื่องสั้นกว่า PC มาก (ประมาณ 8 ข้อความล่าสุด / 1,600 ตัวอักษร) และคำตอบถูกจำกัดที่ประมาณ 512 tokens
- คุณภาพภาษาไทยขึ้นกับโมเดล: **Typhoon2 1B** และ **Qwen 2.5 1.5B** เป็นตัวเลือกที่เน้นภาษาไทยเป็นพิเศษ

---

## ฟีเจอร์และวิธีใช้โดยละเอียด

### 1. หน้าแชท

- พิมพ์ข้อความในช่องด้านล่างแล้วกดปุ่มส่ง
- คำตอบจะแสดงแบบ **streaming** ทีละคำ
- ระหว่างที่ AI กำลังตอบ จะมีปุ่ม **Stop** ให้กดหยุด ข้อความที่ได้แล้วจะถูกเก็บไว้
- ชื่อแชทจะถูกตั้งจากข้อความแรกอัตโนมัติ (แก้ไขภายหลังได้)
- หัวหน้าแชทจะแสดงโมเดลที่ใช้งานจริง เช่นชื่อโมเดลบนเครื่อง หรือโมเดล Ollama ที่เลือก
- ระบบจะแนบวันที่/เวลาปัจจุบันของเครื่องเข้า system prompt ให้ AI อ้างอิงได้ จึงตอบคำถามเรื่อง "วันนี้วันอะไร" หรือวันที่/เวลาปัจจุบันได้ตรงกว่า
- ถ้าเชื่อมต่อ Ollama ได้ จะเห็น badge สถานะและ latency
- Markdown ที่ AI ส่งมาจะถูก render เช่นหัวข้อ, bullet, ตาราง, โค้ดบล็อก และลิงก์

### 2. จัดการข้อความ

| การกระทำ | วิธีใช้ | ผลลัพธ์ |
|---|---|---|
| **Copy** | กด **Copy** ใต้ข้อความล่าสุด หรือกดค้างที่ bubble ใดก็ได้ | คัดลอกข้อความนั้นไปยัง clipboard |
| **Regenerate** | กด **Regenerate** ใต้คำตอบ assistant ล่าสุด | สร้างคำตอบใหม่แทนอันเดิม โดยใช้ประวัติก่อนหน้านั้น |
| **Retry** | กด **Retry** เมื่อคำตอบขึ้น error | ลองสร้างคำตอบนั้นใหม่ |
| **Edit** | กด **Edit** ใต้ข้อความผู้ใช้ล่าสุด | นำข้อความกลับมาแก้ในช่องพิมพ์ แล้วส่งใหม่ |
| **Delete** | กด **Delete** ใต้ข้อความผู้ใช้ล่าสุด | ลบข้อความนั้นและคำตอบทั้งหมดที่ตามมา |

> **Edit** และ **Delete** จะลบข้อความหลังจากจุดนั้นทิ้ง เพื่อไม่ให้ประวัติแชทขัดกัน ควรใช้เมื่อต้องการแก้บทสนทนาย้อนหลังจริง ๆ

### 3. ไฟล์แนบ

กดไอคอน **รูปคลิป** ด้านซ้ายของช่องพิมพ์ แล้วเลือก **Photo** หรือ **File**

- **รูปภาพ:** สูงสุด 4 รูป, รูปละไม่เกิน 10 MB
- **ไฟล์ข้อความ:** รองรับ `text/*` และ `application/json` ขนาดไม่เกิน 100 KB
- เนื้อหาไฟล์ข้อความจะถูกแนบเข้าไปใน prompt พร้อมชื่อไฟล์
- รูปภาพจะถูกส่งเป็น base64 ไปยัง Ollama

ข้อจำกัดสำคัญ:

- รูปภาพใช้ได้เฉพาะเมื่อ **AI Source = PC** และโมเดลที่เลือกมี capability `vision`
- ถ้าเลือกโมเดลที่ไม่แน่ใจว่าเห็นรูปได้ แอปจะถามยืนยันก่อนส่ง
- โมเดลบนเครื่องไม่รองรับรูปภาพ จะเห็นคำเตือนและเลือกส่งเฉพาะข้อความได้

### 4. ประวัติแชทและค้นหา

- เปิดเมนูด้านซ้าย → **New chat** เพื่อเริ่มแชทใหม่
- รายการ **Recent** แสดงแชทล่าสุดพร้อม preview และเวลาอัปเดต
- **กดค้างที่ชื่อแชท** เพื่อ **Rename** หรือ **Delete**
- **Search chats** ค้นได้ทั้งชื่อแชทและเนื้อหาข้อความ พร้อมไฮไลต์คำที่พบ
- **Settings → Chat History Management** แสดงจำนวนแชท/ข้อความ และล้างประวัติทั้งหมดได้
- การล้างประวัติจะ **ไม่** ลบโปรไฟล์ การตั้งค่า หรือ Personal Intelligence

### 5. แหล่ง AI และการสลับโมเดล

ไปที่ **Settings → Model Management**

| โหมด | พฤติกรรม |
|---|---|
| **Auto** | ใช้โมเดลบนเครื่องถ้ามีติดตั้งไว้ ไม่งั้นใช้ Ollama บนคอม |
| **On-device** | ใช้โมเดลบนเครื่องเสมอ ถ้ายังไม่มีโมเดลจะเตือนให้ไปดาวน์โหลด |
| **PC** | ใช้ Ollama บนคอมเสมอ แม้ในเครื่องจะมีโมเดลติดตั้งอยู่ |

- เปลี่ยนโหมดได้ตลอดเวลา แม้ดาวน์โหลดโมเดลบนเครื่องแล้ว
- เลือก **Default PC model** สำหรับโมเดล Ollama ที่จะใช้
- ดูรายการโมเดลที่ดาวน์โหลดไว้บนคอม และกดลบได้
- **Pull new model** ดึงโมเดลใหม่จาก Ollama registry พร้อมแถบความคืบหน้า
- โมเดลที่ไม่มี capability `completion` จะถูกซ่อนจากรายการแชทโดยอัตโนมัติ

### 6. ปรับแต่ง AI

**Settings → Customize AI**

- ตั้ง **System prompt** เป็นคำสั่งประจำ เช่น "ตอบสั้น กระชับ ใช้ภาษาไทย"
- ดูตัวอย่าง prompt จริงที่จะส่งให้โมเดล
- กด **Reset to default** เพื่อล้างคำสั่ง

**Settings → Personal Intelligence**

- เก็บบันทึกเกี่ยวกับตัวเอง เช่น ที่อยู่ ภาษาที่ชอบ สิ่งที่กำลังเรียน
- ข้อความเหล่านี้จะถูกส่งเป็นส่วนหนึ่งของ system message ทุกครั้ง
- ถ้าไม่มี system prompt บันทึกเหล่านี้จะกลายเป็น system message แทน
- ข้อมูลถูกเก็บในเครื่องเท่านั้น

### 7. โปรไฟล์และธีม

- **Settings → Profile / Email / Phone Number** แก้ชื่อ อีเมล และเบอร์โทรได้
- โปรไฟล์เป็นเพียงข้อมูลในเครื่อง ใช้แสดง avatar และชื่อใน drawer ไม่มีการสมัครหรือยืนยันตัวตน
- **Settings → Theme** เลือก **Light**, **Dark** หรือ **System**
- โหมด Dark ได้รับการแก้ไขเรื่องสีข้อความ Markdown ให้อ่านชัดเจนในเวอร์ชัน 1.4.2

### 8. การเชื่อมต่อ

**Settings → Connection Settings**

- ใส่/แก้ Base URL ของ Ollama
- **Test Connection** ตรวจสถานะและวัด latency
- **Find Ollama on this network** สแกนหาเซิร์ฟเวอร์ในวง LAN (อาจใช้เวลาสักครู่)
- แสดงจำนวนโมเดลที่พบและเวลาที่ตรวจล่าสุด

### 9. รีเซ็ตแอป

**Settings → About → Reset app**

ล้างแชท การตั้งค่า โปรไฟล์ และ personal notes ทั้งหมด รวมถึงลืมรายการโมเดลที่ติดตั้ง จากนั้นกลับไปหน้า onboarding

> **Reset app ไม่ได้ลบไฟล์โมเดลที่ดาวน์โหลดไว้** หากต้องการคืนพื้นที่ ให้ลบโมเดลที่หน้า **On-device AI** หรือถอนแอป (การถอนแอปจะลบข้อมูลและไฟล์ทั้งหมด)

---

### 10. วันเวลา, ค้นหาบนเว็บ และอัปเดตแอป

- **Date & Time** — ใช้เวลาเครื่อง หรือตั้งวัน/เวลาและ timezone อ้างอิงสำหรับ AI โดยไม่เปลี่ยนนาฬิกาเครื่อง
- **Web Search** - if enabled (default off), app searches DuckDuckGo before answering and adds results to prompt; uses internet even when the model runs on-device
- **App Updates** — แอปจะเช็คอัปเดตอัตโนมัติตอนเปิด และให้กด Restart ได้; native/runtime changes ยังต้องติดตั้ง build ใหม่

## แผนที่หน้าตั้งค่า

```text
Settings
├── Account Settings
│   ├── Profile
│   ├── Email
│   ├── Phone Number
│   └── Personal Intelligence
├── AI Settings
│   ├── Connection Settings
│   ├── AI Source + Model Management
│   ├── On-device AI
│   └── Customize AI
├── General and UI
│   ├── Date & Time
│   ├── Web Search
│   ├── App Updates
│   ├── Theme
│   └── Chat History Management
└── About
    ├── Ollama documentation
    └── Reset app
```

---

## แก้ปัญหา

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| ติดตั้ง APK ไม่ได้ / **App not installed** | เครื่องไม่ใช่ arm64, พื้นที่ไม่พอ, หรือ signature ชนกับเวอร์ชันเก่า | ตรวจว่าเป็นมือถือ Android รุ่นปกติ (ไม่ใช่ emulator x86), เพิ่มพื้นที่, ถอนเวอร์ชันเก่าก่อน |
| Play Protect เตือน | เป็น APK ที่ไม่ได้มาจาก Play Store | กด **More details → Install anyway** |
| **Could not reach Ollama** | คนละ Wi-Fi, IP ผิด, Ollama ฟังแค่ localhost, firewall บล็อก, VPN | เปิด `http://<IP>:11434` ในเบราว์เซอร์มือถือก่อน แล้วตรวจ `OLLAMA_HOST`, firewall และ VPN |
| ต่อได้ในเบราว์เซอร์ แต่แอปต่อไม่ได้ | ใส่ URL ผิดหรือมี `/api` ต่อท้าย | ใช้ `http://IP:11434` เท่านั้น แล้วกด Test Connection ใหม่ |
| **No models yet** | ยังไม่ได้ pull โมเดลบนคอม | `ollama pull qwen2.5:3b` หรือกด Pull ในแอป |
| โมเดลหายจากรายการ | โมเดลนั้นไม่รองรับ chat | เลือกโมเดลที่มี `completion` capability เช่น `qwen2.5:3b` |
| ดาวน์โหลดโมเดลบนเครื่องไม่สำเร็จ | พื้นที่ไม่พอ, เน็ตหลุด, เข้า Hugging Face ไม่ได้ | ตรวจพื้นที่ว่าง (เผื่อ 300 MB), เปลี่ยน Wi-Fi, กด **Retry download** |
| โมเดลบนเครื่องโหลดไม่ขึ้น / ช้ามาก | RAM ไม่พอ หรือเครื่องร้อน | ลองโมเดลเล็กลง, ปิดแอปอื่น, หรือกลับไปใช้ PC |
| คำตอบยาวแล้วขาดกลางคัน | โมเดลบนเครื่องจำกัดประมาณ 512 tokens | พิมพ์ "ตอบต่อ" หรือใช้ PC สำหรับคำตอบยาว |
| รูปภาพส่งไม่ได้ | ใช้โมเดลบนเครื่อง หรือโมเดล PC ไม่มี vision | สลับเป็น PC และเลือกโมเดลที่รองรับ vision |
| คีย์บอร์ดบังช่องพิมพ์ | เวอร์ชันเก่า | อัปเดตเป็น 1.4.2 ซึ่งใช้ `react-native-keyboard-controller` + `adjustResize` |
| ข้อความใน dark mode เป็นสีดำ | บั๊ก Markdown style ในเวอร์ชันก่อน 1.4.2 | อัปเดตเป็น 1.4.2 |
| เชื่อมต่อได้วันนี้ แต่พรุ่งนี้ใช้ไม่ได้ | IP ของคอมเปลี่ยน (DHCP) | ใช้ **Find Ollama on this network** หรือตั้ง IP คงที่ในเราเตอร์ |
| ลิงก์ APK ใช้ไม่ได้ | ลิงก์ EAS mirror หมดอายุ | ใช้ลิงก์จาก [GitHub Release](https://github.com/fadell-new/OCBM-Ollama-Chat-Bot-Mobile/releases) หรือ build ใหม่ตามหัวข้อ [สำหรับนักพัฒนา](#สำหรับนักพัฒนา) |

### เคล็ดลับเมื่อเชื่อมต่อไม่ได้

1. ตรวจว่า Ollama ยังรันอยู่: `ollama list`
2. ตรวจว่าพอร์ตเปิด: Windows ใช้ `netstat -ano | findstr :11434`
3. ตรวจว่า firewall ไม่บล็อก และ network profile เป็น Private
4. ปิด VPN ชั่วคราว
5. ลองใช้ IP ของคอมเครื่องอื่นในวงเดียวกันเปิด `http://IP:11434` ดูว่าเข้าถึงได้จากอุปกรณ์อื่นหรือไม่
6. ถ้าเราเตอร์เปิด **AP isolation / client isolation** ต้องปิดก่อน

---

## ความเป็นส่วนตัว

- **ไม่มีบัญชีและไม่มีคลาวด์** — OCBM ไม่มีระบบ login ไม่มีเซิร์ฟเวอร์กลาง และไม่มี analytics/telemetry ของแอปเอง
- **แชทและโปรไฟล์อยู่ในเครื่อง** — เก็บใน AsyncStorage และไฟล์ใน app document directory
- **คำขอไปยัง Ollama ตามที่คุณตั้งค่า** — เมื่อใช้ PC ข้อความจะถูกส่งไปยัง `baseUrl` ที่คุณระบุ ซึ่งปกติอยู่ใน LAN ของคุณ
- **โมเดลบนเครื่องไม่ส่งข้อมูลออก** — ประมวลผลในมือถือทั้งหมด ใช้ได้แบบ airplane mode หลังดาวน์โหลดโมเดลแล้ว
- **การดาวน์โหลดโมเดล** — ไฟล์ GGUF ดาวน์โหลดจาก Hugging Face โดยตรง
- **ไฟล์แนบ** — รูปและไฟล์จะถูกคัดลอกเข้า storage ของแอป และส่งต่อไปยังโมเดลเมื่อคุณกดส่ง
- **Personal Intelligence** — ข้อความที่คุณใส่จะถูกส่งเป็น system prompt ไปยังโมเดลที่เลือก
- **รีเซ็ต/ถอนการติดตั้ง** — `Reset app` ล้างแชท การตั้งค่า โปรไฟล์ และ personal notes ส่วนไฟล์โมเดลที่ดาวน์โหลดอาจยังอยู่ใน storage ของแอปจนกว่าจะลบที่ On-device AI หรือถอนแอป (การถอนแอปลบข้อมูลและโมเดลทั้งหมด)

> การเชื่อมต่อ Ollama ผ่าน `http://` ใน LAN ไม่ได้เข้ารหัส (TLS) ควรใช้ในเครือข่ายที่คุณเชื่อถือ และไม่ควรเปิดพอร์ต Ollama ออกสู่อินเทอร์เน็ตโดยตรง

---

## ข้อจำกัดที่ควรรู้

- **Android เท่านั้น** — ไม่มีแผนรองรับ iOS/iPadOS ในตอนนี้
- **arm64-v8a เท่านั้น** — เครื่อง 32-bit และ emulator x86 ติดตั้งไม่ได้
- **โมเดลบนเครื่อง ≤ 2B** — เป็นข้อจำกัดที่ตั้งใจไว้เพื่อให้รันบนมือถือได้จริง คุณภาพจึงต่ำกว่าโมเดลใหญ่บน PC
- **โมเดลบนเครื่องเป็น text-only** — ไม่รองรับรูปภาพ
- **บริบทบนเครื่องสั้น** — ประมาณ 8 ข้อความ / 1,600 ตัวอักษร และตอบได้ประมาณ 512 tokens ต่อครั้ง
- **ดาวน์โหลดโมเดลไม่ resume** — ต้องเริ่มใหม่หากล้มเหลว
- **ไม่มีการซิงก์ข้ามเครื่อง** — แต่ละเครื่องมีประวัติของตัวเอง
- **UI เป็นภาษาอังกฤษ** — ส่วน README นี้เป็นภาษาไทย
- **APK เป็น internal preview** — ไม่ได้เผยแพร่บน Play Store และอาจมีคำเตือนจากระบบ
- **Ollama ต้องเปิดคอมทิ้งไว้** — ถ้าคอม sleep หรือปิด Wi-Fi การเชื่อมต่อจะหลุด

---

## สำหรับนักพัฒนา

### Tech stack

- **Expo SDK 58** + **React Native 0.88** + **TypeScript**
- **Expo Router** (drawer + settings stack)
- **Zustand** + **AsyncStorage** สำหรับ state และ persistence
- **llama.rn 0.13.0-rc.8** สำหรับ on-device inference ผ่าน llama.cpp
- **react-native-keyboard-controller** สำหรับ keyboard avoidance
- **react-native-markdown-display** สำหรับ render Markdown
- **Jest** + **React Native Testing Library**

### สิ่งที่ต้องมี

- Node.js 20+
- npm
- Android Studio + JDK 17 (กรณี build native ในเครื่อง)
- บัญชี Expo/EAS (กรณี build APK ผ่าน EAS)

### รันโปรเจกต์

```bash
npm install
npx expo start
```

> โมเดลบนเครื่องต้องใช้ **development build** หรือ APK ที่มี native module `llama.rn` — ใช้กับ Expo Go ไม่ได้ ส่วนฟีเจอร์ PC (Ollama) ใช้งานผ่าน dev build ได้ตามปกติ

สร้าง development build บนเครื่อง:

```bash
npx expo run:android
```

### ทดสอบ

```bash
npm test
npx tsc --noEmit
```

สถานะปัจจุบัน: **84 tests ผ่านทั้งหมด** และ TypeScript compile ผ่าน

### Build APK ด้วย EAS

```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```

หรือใช้ `npx eas-cli` โดยไม่ติดตั้ง global:

```bash
npx eas-cli build --platform android --profile preview
```

ไฟล์ APK จะอยู่ใน artifact link ที่ EAS แสดงตอน build เสร็จ

### ข้อจำกัดของ build ที่ต้องรักษาไว้

โปรเจกต์นี้ถูกปรับให้ build อยู่ในข้อจำกัด **45 นาทีของ EAS Free plan** และรองรับเครื่อง Android ทั่วไป:

- `app.json` → `expo-build-properties.android.buildArchs = ["arm64-v8a"]`
- `app.json` → `expo-build-properties.android.usesCleartextTraffic = true` (จำเป็นสำหรับ Ollama ผ่าน HTTP ใน LAN)
- `eas.json` → `preview.env.ORG_GRADLE_PROJECT_rnllamaVariants = "rnllama,rnllama_v8_2_dotprod_i8mm"`

> **ห้ามลบ** `ORG_GRADLE_PROJECT_rnllamaVariants` หรือเพิ่ม ABI อื่นโดยไม่ตั้งใจ เพราะจะทำให้ `llama.rn` build variant ครบทุกตัวและชนเวลา 45 นาที
>
> เวอร์ชัน 1.4.2 ใช้เวลา build ประมาณ 12.6 นาที

### โครงสร้างโปรเจกต์

```text
src/
  app/          Expo Router routes
    (drawer)/   หน้าแชทหลัก + drawer
    settings/   หน้าตั้งค่าทั้งหมด
    onboarding  ตั้งค่าครั้งแรก
    search      ค้นหาแชท
  api/          Ollama client (NDJSON streaming)
  components/   UI components (ChatBubble, Composer, ...)
  lib/          logic (chatSend, context, attachments, modelCatalog, ...)
  store/        Zustand stores
  theme/        design tokens + typography
  types/        shared TypeScript types
__tests__/      Jest tests
docs/           architecture, design, roadmap, changelog
```

ไฟล์สำคัญ:

- `src/lib/modelCatalog.ts` — รายการโมเดล on-device และ logic แนะนำตาม RAM
- `src/lib/localInference.ts` — llama.rn context + generation
- `src/lib/modelDownload.ts` — ดาวน์โหลด/ยกเลิก/ลบ/กระทบยอดโมเดล
- `src/lib/chatSend.ts` — ประกอบ system prompt และ request
- `src/app/settings/models.tsx` — AI Source + จัดการโมเดล Ollama
- `src/app/settings/local-model.tsx` — จัดการโมเดลบนเครื่อง
- `src/components/ChatBubble.tsx` — bubble + Markdown + ปุ่มจัดการข้อความ

---

## เวอร์ชันและเอกสาร

- **1.5.1** — Per-block file artifacts (copy/save/view/ZIP), debug timestamp hallucination, reduced on-device runaway generation, file viewer
- **1.5.0** — Date & Time settings, free DuckDuckGo web search, OTA auto-update checks, App Updates screen, Windows Ollama setup helper
- **1.4.2** — แก้สีข้อความ Markdown ใน dark mode, เพิ่ม regression test, build APK สำเร็จ
- **1.3.x** — stop generation, edit/delete/regenerate, keyboard avoidance, หน้าโปรไฟล์
- **1.2.0** — โมเดล on-device 10 ตัว, AI Source (Auto/On-device/PC), กรองโมเดลที่แชทไม่ได้
- **1.1.0** — หลายโมเดลบนเครื่อง + ตรวจ RAM/พื้นที่ + แนะนำโมเดล
- **1.0.0** — เวอร์ชันแรก

อ่านเพิ่มเติม:

- [CHANGELOG](docs/CHANGELOG.md)
- [ARCHITECTURE](docs/ARCHITECTURE.md)
- [DESIGN](docs/DESIGN.md)
- [ROADMAP](docs/ROADMAP.md)

---

สร้างด้วย [Expo](https://expo.dev), [llama.rn](https://github.com/mybigday/llama.rn) และ [Ollama](https://ollama.com)

**OCBM — Private. Local. Yours.**
