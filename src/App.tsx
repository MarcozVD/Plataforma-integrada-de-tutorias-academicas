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

const queryClient = new QueryClient();

import TutorPanel from "./pages/TutorPanel";
import AdminPanel from "./pages/AdminPanel";
import { ChatWidget } from "./components/chat/ChatWidget";
import { useEffect, useState } from "react";

import { TitleBar } from "./components/TitleBar";
import { ThemeProvider } from "./components/ThemeProvider";

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = ["/", "/register", "/forgot-password", "/reset-password"].includes(location.pathname);
  
  // To react to login changes in localStorage across routes
  const [isStudent, setIsStudent] = useState(false);
  
  useEffect(() => {
    const userType = localStorage.getItem("userType");
    setIsStudent(userType === "student");
  }, [location.pathname]);



  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <TitleBar />
      <div className="flex-1 overflow-y-auto bg-background min-h-0">
        {!isAuthPage && <Header />}
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/index" element={<Index />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/history" element={<History />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/profile" element={<StudentProfile />} />
          <Route path="/tutor/profile" element={<TutorProfile />} />
          <Route path="/tutor" element={<TutorPanel />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {/* Muestra el Chat automatizado solo si es estudiante y no está en la pantalla de login/registro */}
        {!isAuthPage && isStudent && <ChatWidget />}
      </div>
    </div>
  );
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <AppLayout />
        </HashRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
