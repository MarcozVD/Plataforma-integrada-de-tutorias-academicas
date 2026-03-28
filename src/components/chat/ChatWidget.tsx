import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Message = {
  id: string;
  text: React.ReactNode;
  sender: "user" | "bot";
  options?: { label: string; action: () => void }[];
};

export const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const token = localStorage.getItem("token");

  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Math.random().toString(36).substring(7) }]);
  };

  const showTypingAndRespond = (callback: () => void, delay = 600) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      callback();
    }, delay);
  };

  const handleInitialGreeting = () => {
    addMessage({
      text: "¡Hola! Soy tu asistente virtual. Puedo ayudarte a buscar salones, ver tutorías disponibles o revisar tus inscripciones. ¿Qué deseas hacer?",
      sender: "bot",
      options: [
        { label: "Ver Salones", action: () => handleSelection("Ver Salones", fetchRooms) },
        { label: "Tutorías Disponibles", action: () => handleSelection("Tutorías Disponibles", fetchTutorias) },
        { label: "Mis Tutorías", action: () => handleSelection("Mis Tutorías", fetchMyTutorias) },
      ],
    });
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      handleInitialGreeting();
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSelection = (text: string, actionFn: () => void) => {
    addMessage({ text, sender: "user" });
    showTypingAndRespond(actionFn);
  };

  // --- API Functions ---
  const fetchRooms = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/rooms`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error fetching rooms");
      const rooms = await res.json();
      
      if (rooms.length === 0) {
        addMessage({ text: "Actualmente no hay salones registrados.", sender: "bot" });
      } else {
        const roomTexts = rooms.map((r: any) => `📍 **${r.name}** (${r.capacity} cupos) - ${r.building}`).join("\n");
        addMessage({ 
          text: (
            <div className="whitespace-pre-line text-sm">
              <p className="font-semibold mb-2">Salones registrados:</p>
              {rooms.map((r: any) => (
                <div key={r.id} className="mb-2 p-2 bg-muted rounded">
                  <span className="font-bold">{r.name}</span> ({r.building})<br/>
                  Cupo: {r.capacity} personas
                </div>
              ))}
            </div>
          ), 
          sender: "bot" 
        });
      }
    } catch (e) {
      addMessage({ text: "Lo siento, hubo un error al obtener los salones.", sender: "bot" });
    }
    showMenuOptions();
  };

  const fetchTutorias = async () => {
    try {
      // In python it's /sessions or /tutor/sessions. Based on models, /sessions is correct for all.
      const res = await fetch(`http://127.0.0.1:8000/auth/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error fetching sessions");
      const sessions = await res.json();

      if (sessions.length === 0) {
        addMessage({ text: "No hay tutorías disponibles en este momento.", sender: "bot" });
        showMenuOptions();
        return;
      }

      addMessage({ 
        text: "Estas son las tutorías disponibles. Haz clic en una para intentar inscribirte:", 
        sender: "bot" 
      });

      // Show options to enroll
      const enrollOptions = sessions.map((s: any) => ({
        label: `Inscribirme a ${s.subject} (${new Date(s.date_time).toLocaleDateString()})`,
        action: () => handleSelection(`Inscribirme a ${s.subject}`, () => enrollTutoria(s.id))
      }));

      addMessage({
        text: "Selecciona una opción:",
        sender: "bot",
        options: enrollOptions
      });

    } catch (e) {
      addMessage({ text: "Lo siento, hubo un error al obtener las tutorías.", sender: "bot" });
      showMenuOptions();
    }
  };

  const enrollTutoria = async (sessionId: number) => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/sessions/${sessionId}/enroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok) {
        addMessage({ text: `No se pudo realizar la inscripción: ${data.detail || "Error desconocido"}`, sender: "bot" });
      } else {
        addMessage({ text: "¡Inscripción exitosa! Te hemos registrado en la tutoría.", sender: "bot" });
      }
    } catch (e) {
      addMessage({ text: "Hubo un error de conexión al intentar inscribirte.", sender: "bot" });
    }
    showMenuOptions();
  };

  const fetchMyTutorias = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/auth/student/enrolled-sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Error fetching my sessions");
      const sessions = await res.json();

      if (sessions.length === 0) {
        addMessage({ text: "No tienes tutorías inscritas actualmente.", sender: "bot" });
      } else {
        addMessage({ 
          text: (
            <div className="text-sm">
              <p className="font-semibold mb-2">Tus Tutorías:</p>
              {sessions.map((s: any) => (
                <div key={s.id} className="mb-2 p-2 bg-indigo-50 dark:bg-indigo-950 rounded border border-indigo-100 dark:border-indigo-900 border-l-4 border-l-indigo-500">
                  <span className="font-bold">{s.subject}</span><br/>
                  <span className="text-muted-foreground">{new Date(s.date_time).toLocaleString()}</span><br/>
                  <span className="text-muted-foreground">{s.tutor_name} - {s.room || 'Sin salón asignado'}</span>
                </div>
              ))}
            </div>
          ), 
          sender: "bot" 
        });
      }
    } catch (e) {
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
          { label: "Ver Salones", action: () => handleSelection("Ver Salones", fetchRooms) },
          { label: "Tutorías Disponibles", action: () => handleSelection("Tutorías Disponibles", fetchTutorias) },
          { label: "Mis Tutorías", action: () => handleSelection("Mis Tutorías", fetchMyTutorias) },
        ],
      });
    }, 1000);
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    addMessage({ text: inputValue, sender: "user" });
    setInputValue("");
    
    // Simple echoing / fallback for free text
    showTypingAndRespond(() => {
      addMessage({ 
        text: "Soy un asistente de opciones. Por favor utiliza los botones para interactuar conmigo sobre salones y tutorías.", 
        sender: "bot" 
      });
      showMenuOptions();
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[500px] max-h-[80vh] bg-background border rounded-2xl shadow-xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Asistente Virtual</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="hover:bg-primary-foreground/20 p-1 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl ${
                    msg.sender === "user" 
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-card border shadow-sm rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
                
                {msg.options && (
                  <div className="flex flex-wrap gap-2 mt-2 w-full justify-start pl-2">
                    {msg.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={opt.action}
                        className="text-xs font-medium px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors border border-primary/20"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-card border shadow-sm p-3 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendText} className="p-3 bg-background border-t flex gap-2 items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 bg-muted/50 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <button 
              type="submit" 
              disabled={!inputValue.trim()}
              className="bg-primary text-primary-foreground p-2 rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all hover:scale-105 active:scale-95"
      >
        {isOpen ? <ChevronDown className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};
