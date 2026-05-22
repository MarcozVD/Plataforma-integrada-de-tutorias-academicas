/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE APP PRINCIPAL
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Componente raíz de la aplicación. Proporciona:
 *   - Router para navegación entre páginas
 *   - Providers globales (QueryClient, Tooltip, Toast)
 *   - Layout de la aplicación (Header, ChatWidget)
 * 
 * ESTRUCTURA:
 *   App (Provider principal)
 *     ├─ ThemeProvider (Tema de UI)
 *     ├─ QueryClientProvider (React Query para caché de datos)
 *     ├─ TooltipProvider (Sistema de tooltips)
 *     ├─ HashRouter (Navegación con hash - #/pagina)
 *     │  └─ AppLayout (Layout general)
 *     │     ├─ TitleBar (Barra de título en Electron)
 *     │     ├─ Header (Navegación principal)
 *     │     ├─ Routes (Rutas y páginas)
 *     │     └─ ChatWidget (Chat para estudiantes)
 *     └─ Toast Notifiers (Sonner, Shadcn)
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Index from "./pages/Index";
import Rooms from "./pages/Rooms";
import Schedule from "./pages/Schedule";
import History from "./pages/History";
import Notifications from "./pages/Notifications";
import StudentProfile from "./pages/StudentProfile";
import TutorProfile from "./pages/TutorProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import TutorPanel from "./pages/TutorPanel";
import AdminPanel from "./pages/AdminPanel";
import { ChatWidget } from "./components/chat/ChatWidget";
import { useEffect, useState } from "react";
import { TitleBar } from "./components/TitleBar";
import { ThemeProvider } from "./components/ThemeProvider";

/**
 * Cliente de React Query
 * Gestiona caché de datos y estados de queries asincrónicas
 */
const queryClient = new QueryClient();

/**
 * COMPONENTE AppLayout
 * 
 * PROPÓSITO: Layout principal de la aplicación
 * 
 * FLUJO:
 *   1. Detecta si está en página de autenticación (login, registro)
 *   2. Muestra Header solo en páginas autenticadas
 *   3. Renderiza ChatWidget solo si es estudiante y no está en auth page
 *   4. Mantiene estado de usuario en localStorage
 * 
 * PÁGINAS PROTEGIDAS (requieren autenticación):
 *   - /index (home estudiante)
 *   - /rooms (salas de tutoría)
 *   - /schedule (horario)
 *   - /history (historial de sesiones)
 *   - /notifications (notificaciones)
 *   - /profile (perfil)
 *   - /tutor (panel tutor)
 *   - /admin (panel admin)
 * 
 * PÁGINAS PÚBLICAS:
 *   - / (login)
 *   - /register (registro)
 *   - /forgot-password (recuperar contraseña)
 *   - /reset-password (resetear contraseña)
 */
const AppLayout = () => {
  // Hook para obtener la ruta actual
  const location = useLocation();
  
  // Detecta si está en página de autenticación
  const isAuthPage = ["/", "/register", "/forgot-password", "/reset-password"].includes(location.pathname);
  
  // Estado para saber si el usuario es estudiante (determina si mostrar ChatWidget)
  const [isStudent, setIsStudent] = useState(false);
  
  /**
   * EFECTO: Actualiza tipo de usuario cuando cambia de ruta
   * Esto es necesario para mostrar/ocultar ChatWidget dinámicamente
   */
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    setIsStudent(userType === "student");
  }, [location.pathname]);

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      {/* Barra de título de Electron */}
      <TitleBar />
      
      {/* Area principal scrolleable */}
      <div className="flex-1 overflow-y-auto bg-background min-h-0">
        
        {/* Header (navegación) - solo en páginas autenticadas */}
        {!isAuthPage && <Header />}
        
        {/* Sistema de rutas y páginas */}
        <Routes>
          {/* Autenticación */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Páginas de estudiante */}
          <Route path="/index" element={<Index />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/history" element={<History />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<StudentProfile />} />
          
          {/* Páginas de tutor */}
          <Route path="/tutor/profile" element={<TutorProfile />} />
          <Route path="/tutor" element={<TutorPanel />} />
          
          {/* Página de admin */}
          <Route path="/admin" element={<AdminPanel />} />
          
          {/* Página 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Chat Widget - solo para estudiantes en páginas no-auth */}
        {!isAuthPage && isStudent && <ChatWidget />}
      </div>
    </div>
  );
};

/**
 * COMPONENTE App
 * 
 * PROPÓSITO: Componente raíz que proporciona todos los providers globales
 * 
 * ESTRUCTURA DE PROVIDERS (de adentro hacia afuera):
 *   1. HashRouter: Habilita navegación con URLs hash (#/page)
 *   2. TooltipProvider: Sistema de tooltips global
 *   3. QueryClientProvider: React Query para caché de datos
 *   4. ThemeProvider: Sistema de temas (claro/oscuro)
 *   5. Toast providers: Notificaciones (Sonner y Shadcn)
 */
const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toast notifications */}
        <Toaster />
        <Sonner />
        
        {/* Router y navegación */}
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
