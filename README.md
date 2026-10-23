# OCBM

OCBM is an Android-first (iOS-ready) chat app for talking to an Ollama server running on your own machine. It is built with React Native + Expo and ships a calm, serif-accented UI derived from the supplied Figma file.

- **Private by default** — no accounts, no cloud, no telemetry. Everything stays on your device and your Ollama host.
- **Local models** — streams responses from any Ollama model, with model management, pulling, and deletion built in.
- **Personal intelligence** — optional system prompt + personal notes injected into every request.
- **Attachments** — send images (vision models) and small text files alongside your messages.
- **Theming** — Light, Dark, and System modes.

## Prerequisites

- Node.js 20+
- Expo CLI (`npx expo`)
- An Ollama server reachable from the device (`http://<host>:11434`)

## Ollama setup

For the Android emulator, `127.0.0.1` on the device refers to the emulator itself. Point OCBM at the host machine instead:

```bash
# On the host machine
OLLAMA_HOST=0.0.0.0 OLLAMA_ORIGINS=* ollama serve
```

- Allow inbound traffic on port `11434` in the firewall.
- Android emulator: use `http://10.0.2.2:11434`.
- Real device on the same network: use `http://<LAN-IP>:11434`.
- Pull a model: `ollama pull qwen2.5:3b`.

## Run

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go (Android) or press `w` for web.

Web QA / development:

```bash
npx expo start --web
```

## Tests

```bash
npm test -- --runInBand
npx tsc --noEmit
```

## Build APK (EAS)

```bash
npm install -g eas-cli
eas login
eas build --profile preview --platform android
```

See `eas.json` for the `development`, `preview`, and `production` profiles.

## Troubleshooting

- **Connection refused** — make sure Ollama is running with `OLLAMA_HOST=0.0.0.0` and the firewall allows port 11434.
- **Cleartext blocked** — `app.json` already sets `usesCleartextTraffic: true` for Android.
- **Model not found** — pull the model on the host (`ollama pull <name>`) or use Model Management in Settings.
- **Vision model** — attach images only works with models that report a `vision` capability.

## Project structure

```
src/
  app/          Expo Router routes (drawer, settings, onboarding, search)
  components/   Shared UI (Composer, ChatBubble, SettingsPage, ...)
  lib/          Utilities (chatSend, context, attachments, storage, ...)
  store/        Zustand stores (chats, settings, connection)
  api/          Ollama client
  theme/        Tokens + typography
  types/        Shared TypeScript types
docs/           Design, architecture, roadmap, changelog
```
