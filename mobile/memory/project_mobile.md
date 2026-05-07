---
name: PITA Mobile App
description: Expo React Native app created from the Electron desktop app, located in mobile/
type: project
---

Se creó la app mobile Expo en la carpeta `mobile/` dentro del mismo repo.

**Why:** El usuario quería la misma app de escritorio (Electron) disponible en Android e iOS usando Expo Go.

**How to apply:** Al hablar de la app mobile, siempre trabajar en `mobile/`. La app web/desktop sigue en la raíz. Los endpoints del backend son los mismos (`/auth/...`).

Tecnologías mobile:
- Expo SDK 51 + Expo Router v3 (file-based routing)
- NativeWind v4 (Tailwind CSS para React Native)
- @tanstack/react-query v5
- React Hook Form + Zod
- @expo/vector-icons (Ionicons)
- AsyncStorage (reemplaza localStorage)

URL backend: `EXPO_PUBLIC_API_URL` en `.env` (default `http://10.0.2.2:8000` para Android emulator)
