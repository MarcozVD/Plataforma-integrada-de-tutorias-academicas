// =============================================================================
// mobile/app/_layout.tsx — Layout raíz de la aplicación móvil
// =============================================================================
// Este es el componente de entrada que Expo Router monta primero.
// Su responsabilidad es envolver TODA la app con los proveedores globales:
//   1. SafeAreaProvider  → gestiona los márgenes seguros de pantalla (notch, barra de estado)
//   2. QueryClientProvider → provee el cliente de TanStack Query para data fetching
//   3. AuthProvider     → provee el contexto de autenticación (token, userType, etc.)
//   4. Stack            → define el navegador de pila para las rutas del grupo raíz
//   5. StatusBar        → configura el estilo de la barra de estado del sistema
// =============================================================================

import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';

// Importa los estilos globales de NativeWind (Tailwind para React Native)
import '../global.css';

// ─── Configuración del cliente de TanStack Query ──────────────────────────────
// Se crea una instancia única del QueryClient con opciones por defecto:
//   - retry: 1       → si una consulta falla, reintenta solo 1 vez antes de mostrar error
//   - staleTime: 5min → los datos en caché se consideran "frescos" durante 5 minutos
//                       evitando refetches innecesarios mientras el usuario navega
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
  },
});

// ─── Componente RootLayout ────────────────────────────────────────────────────
// Flujo de renderizado:
//   SafeAreaProvider
//     └─ QueryClientProvider (inyecta queryClient a todos los hooks useQuery/useMutation)
//         └─ AuthProvider (inyecta token, userType, login(), logout() a toda la app)
//             ├─ Stack (renderiza la pantalla activa según la ruta actual)
//             └─ StatusBar (barra de estado del dispositivo en modo claro)
export default function RootLayout() {
  return (
    // Provee los insets de área segura (notch, barra inferior de iPhone, etc.)
    <SafeAreaProvider>
      {/* Provee el cliente de caché/fetching de datos a todos los componentes hijos */}
      <QueryClientProvider client={queryClient}>
        {/* Provee el estado de autenticación global */}
        <AuthProvider>
          {/* Navegador de pila: renderiza la pantalla correspondiente a la ruta activa */}
          {/* headerShown: false → sin encabezado nativo, cada pantalla maneja su propio header */}
          <Stack screenOptions={{ headerShown: false }} />

          {/* Barra de estado del sistema operativo con iconos en color claro */}
          <StatusBar style="light" />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
