// =============================================================================
// mobile/app/(auth)/_layout.tsx — Layout del grupo de autenticación
// =============================================================================
// Define la estructura de navegación para todas las rutas del grupo (auth):
//   - /(auth)/login    → pantalla de inicio de sesión
//   - /(auth)/register → pantalla de registro de nuevo usuario
//
// Usa un Stack (navegador de pila) sin encabezado nativo (headerShown: false)
// porque cada pantalla dentro del grupo implementa su propio diseño de header.
//
// Expo Router agrupa automáticamente los archivos dentro de (auth)/ bajo
// este layout. El paréntesis en el nombre de la carpeta indica que es un
// "grupo de rutas" que no afecta la URL navegable.
// =============================================================================

import { Stack } from 'expo-router';

// Renderiza el navegador de pila para las pantallas de autenticación
// sin mostrar el header nativo de React Navigation
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
