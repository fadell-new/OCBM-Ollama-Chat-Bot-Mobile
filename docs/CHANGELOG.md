# Changelog

## 1.0.0

Initial release.

### Features

- First-run onboarding (Welcome → Connection → Model).
- Chat with streaming responses from a local Ollama server.
- Drawer with chat list, rename, delete, and search.
- Settings: account profile, customize AI prompt, personal intelligence, theme, chat history, about, connection, model management.
- Model management: default model selection, download list, pull with progress, delete with confirmation.
- Connection settings: base URL, test connection (latency + model count), help.
- Image and text file attachments (vision-capability aware).
- Light, Dark, and System themes.

### Engineering

- React Native + Expo (SDK 58), TypeScript strict.
- Zustand + AsyncStorage state.
- 14 test suites / 76 tests.
- Web export verified.
