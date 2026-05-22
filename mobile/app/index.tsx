// =============================================================================
// mobile/app/index.tsx — Pantalla de redirección inicial
// =============================================================================
// Esta pantalla actúa como "guardia de ruta" al abrir la aplicación.
// No muestra contenido permanente: su único propósito es leer el estado
// de autenticación y redirigir al usuario al grupo de rutas correcto.
//
// Flujo de navegación:
//   1. Si isLoading=true  → muestra spinner mientras el AuthContext
//                           recupera el token guardado en AsyncStorage
//   2. Si no hay token    → redirige a /(auth)/login (usuario no autenticado)
//   3. Si userType=tutor  → redirige a /(tutor)/   (panel del tutor)
//   4. Si userType=admin  → redirige a /(admin)/   (panel del administrador)
//   5. Por defecto        → redirige a /(student)/  (dashboard del estudiante)
// =============================================================================

import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/context/AuthContext';

export default function Index() {
  // Extrae el token JWT, el tipo de usuario y el estado de carga del AuthContext
  const { token, userType, isLoading } = useAuth();

  // ── Estado de carga ──────────────────────────────────────────────────────
  // Mientras el contexto intenta restaurar la sesión desde AsyncStorage,
  // se muestra un spinner centrado para evitar un flash de redirección
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#00AEEF" />
      </View>
    );
  }

  // ── Redirecciones según estado de autenticación y rol ────────────────────

  // Sin token → el usuario no está autenticado, va a login
  if (!token) return <Redirect href="/(auth)/login" />;

  // Token válido, rol tutor → panel del tutor
  if (userType === 'tutor') return <Redirect href="/(tutor)/" />;

  // Token válido, rol admin → panel del administrador
  if (userType === 'admin') return <Redirect href="/(admin)/" />;

  // Token válido, rol estudiante (o cualquier otro) → dashboard estudiantil
  return <Redirect href="/(student)/" />;
}
