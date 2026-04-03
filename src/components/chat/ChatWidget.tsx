import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  text: React.ReactNode;
  sender: "user" | "bot";
  options?: { label: string; action: () => void }[];
};

export const ChatWidget = () => {
  const [isOpen, setIsOpen]       = useState(false);
  const [messages, setMessages]   = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Lógica original del compañero — localStorage
  const token = localStorage.getItem("token");

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substring(7) }]);
  };

  const showTypingAndRespond = (callback: () => void, delay = 600) => {
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); callback(); }, delay);
  };

  const handleInitialGreeting = () => {
    addMessage({
      text: "¡Hola! Soy tu asistente virtual. Puedo ayudarte a buscar salones, ver tutorías disponibles o revisar tus inscripciones. ¿Qué deseas hacer?",
      sender: "bot",
      options: [
        { label: "Ver Salones",            action: () => handleSelection("Ver Salones",            fetchRooms)      },
        { label: "Tutorías Disponibles",   action: () => handleSelection("Tutorías Disponibles",   fetchTutorias)   },
        { label: "Mis Tutorías",           action: () => handleSelection("Mis Tutorías",           fetchMyTutorias) },
      ],
    });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) handleInitialGreeting();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelection = (text: string, actionFn: () => void) => {
    addMessage({ text, sender: "user" });
    showTypingAndRespond(actionFn);
  };

  // ── API — URLs relativas (sin hardcode de localhost) ──────────────────────
  const fetchRooms = async () => {
    try {
      const res = await fetch("/auth/rooms", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const rooms = await res.json();
      if (rooms.length === 0) {
        addMessage({ text: "Actualmente no hay salones registrados.", sender: "bot" });
      } else {
        addMessage({
          text: (
            <div className="text-sm space-y-1.5">
              <p className="font-semibold text-foreground mb-2">Salones registrados:</p>
              {rooms.map((r: any) => (
                <div key={r.id} className="p-2 rounded-lg bg-[#00AEEF]/8 border border-[#00AEEF]/15">
                  <span className="font-semibold text-[#0090C5]">{r.name}</span>
                  <span className="text-muted-foreground"> · {r.building}</span>
                  <br />
                  <span className="text-xs text-muted-foreground">Capacidad: {r.capacity} personas</span>
                </div>
              ))}
            </div>
          ),
          sender: "bot",
        });
      }
    } catch {
      addMessage({ text: "Lo siento, hubo un error al obtener los salones.", sender: "bot" });
    }
    showMenuOptions();
  };

  const fetchTutorias = async () => {
    try {
      const res = await fetch("/auth/sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const sessions = await res.json();
      if (sessions.length === 0) {
        addMessage({ text: "No hay tutorías disponibles en este momento.", sender: "bot" });
        showMenuOptions();
        return;
      }
      addMessage({ text: "Estas son las tutorías disponibles. Haz clic en una para inscribirte:", sender: "bot" });
      addMessage({
        text: "Selecciona una opción:",
        sender: "bot",
        options: sessions.map((s: any) => ({
          label: `Inscribirme a ${s.subject} (${new Date(s.date_time).toLocaleDateString("es-CO")})`,
          action: () => handleSelection(`Inscribirme a ${s.subject}`, () => enrollTutoria(s.id)),
        })),
      });
    } catch {
      addMessage({ text: "Lo siento, hubo un error al obtener las tutorías.", sender: "bot" });
      showMenuOptions();
    }
  };

  const enrollTutoria = async (sessionId: number) => {
    try {
      const res = await fetch(`/auth/sessions/${sessionId}/enroll`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        addMessage({ text: `No se pudo realizar la inscripción: ${data.detail || "Error desconocido"}`, sender: "bot" });
      } else {
        addMessage({ text: "¡Inscripción exitosa! Te hemos registrado en la tutoría. 🎉", sender: "bot" });
      }
    } catch {
      addMessage({ text: "Hubo un error de conexión al intentar inscribirte.", sender: "bot" });
    }
    showMenuOptions();
  };

  const fetchMyTutorias = async () => {
    try {
      const res = await fetch("/auth/student/enrolled-sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const sessions = await res.json();
      if (sessions.length === 0) {
        addMessage({ text: "No tienes tutorías inscritas actualmente.", sender: "bot" });
      } else {
        addMessage({
          text: (
            <div className="text-sm space-y-1.5">
              <p className="font-semibold text-foreground mb-2">Tus tutorías:</p>
              {sessions.map((s: any) => (
                <div key={s.id} className="p-2 rounded-lg border-l-4 border-l-[#8DC63F] bg-[#8DC63F]/8 border border-[#8DC63F]/20">
                  <span className="font-semibold text-foreground">{s.subject}</span><br />
                  <span className="text-xs text-muted-foreground">
                    {new Date(s.date_time).toLocaleString("es-CO")}
                  </span><br />
                  <span className="text-xs text-muted-foreground">
                    {s.tutor_name} · {s.room || "Sin salón asignado"}
                  </span>
                </div>
              ))}
            </div>
          ),
          sender: "bot",
        });
      }
    } catch {
      addMessage({ text: "Hubo un error al obtener tus tutorías.", sender: "bot" });
    }
    showMenuOptions();
  };

  const showMenuOptions = () => {
    setTimeout(() => {
      addMessage({
        text: "¿En qué más te puedo ayudar?",
        sender: "bot",
        options: [
          { label: "Ver Salones",          action: () => handleSelection("Ver Salones",          fetchRooms)      },
          { label: "Tutorías Disponibles", action: () => handleSelection("Tutorías Disponibles", fetchTutorias)   },
          { label: "Mis Tutorías",         action: () => handleSelection("Mis Tutorías",         fetchMyTutorias) },
        ],
      });
    }, 1000);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    addMessage({ text: inputValue, sender: "user" });
    setInputValue("");
    showTypingAndRespond(() => {
      addMessage({
        text: "Soy un asistente de opciones. Por favor utiliza los botones para interactuar conmigo sobre salones y tutorías.",
        sender: "bot",
      });
      showMenuOptions();
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[500px] max-h-[80vh] bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">

          {/* Header UNAB */}
          <div className="flex items-center justify-between px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <GraduationCap size={15} className="text-white" />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold leading-none">Asistente Virtual</p>
                <p className="text-[10px] text-white/70 leading-none mt-0.5">UNAB Tutorías</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-[#00AEEF] text-white rounded-br-sm"
                    : "bg-card border border-border/60 shadow-sm rounded-bl-sm text-foreground"
                }`}>
                  {msg.text}
                </div>
                {msg.options && (
                  <div className="flex flex-wrap gap-1.5 mt-2 w-full justify-start pl-1">
                    {msg.options.map((opt, i) => (
                      <button key={i} onClick={opt.action}
                        className="text-xs font-medium px-3 py-1.5 bg-[#00AEEF]/10 text-[#0090C5] hover:bg-[#00AEEF]/20 rounded-full transition-colors border border-[#00AEEF]/25">
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Indicador de escritura */}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-card border border-border/60 shadow-sm px-3 py-2 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  {[0, 150, 300].map(delay => (
                    <div key={delay} className="w-2 h-2 rounded-full bg-[#00AEEF]/50 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSendText} className="p-3 bg-background border-t border-border/60 flex gap-2 items-center">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 bg-muted/40 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40" />
            <button type="submit" disabled={!inputValue.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00AEEF] hover:bg-[#0090C5] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Send size={15} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Botón flotante UNAB */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #00AEEF, #6B2D8B)" }}>
        {isOpen ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
};