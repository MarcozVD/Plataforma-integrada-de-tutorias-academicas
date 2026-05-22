/**
 * ════════════════════════════════════════════════════════════════════════════════
 * COMPONENTE: ChatWidget - Asistente virtual (Chatbot)
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Widget de chat flotante que actúa como asistente virtual para estudiantes.
 *   Permite consultar salones, tutorías disponibles e inscribirse a sesiones
 *   directamente desde el chat.
 * 
 * FLUJO GENERAL:
 *   1. Botón flotante en esquina inferior derecha (siempre visible)
 *   2. Al hacer click, abre panel de chat con saludo inicial
 *   3. Bot presenta opciones: Ver Salones, Tutorías Disponibles, Mis Tutorías
 *   4. Estudiante selecciona opción → Bot consulta API y muestra resultados
 *   5. Después de cada acción, ofrece opciones nuevamente
 * 
 * FUNCIONALIDADES:
 *   - Ver salones registrados (nombre, edificio, capacidad)
 *   - Ver tutorías disponibles e inscribirse
 *   - Ver tutorías inscritas del estudiante
 *   - Escribir texto libre (redirige a usar botones)
 */

import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, ChevronDown, GraduationCap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/**
 * TIPO: Message
 * 
 * Estructura de un mensaje en el chat:
 * - id: Identificador único del mensaje
 * - text: Contenido del mensaje (puede ser texto o JSX/ReactNode)
 * - sender: Quién envió el mensaje ("user" o "bot")
 * - options: Botones de opción que el bot puede mostrar (opcional)
 */
type Message = {
  id: string;
  text: React.ReactNode;
  sender: "user" | "bot";
  options?: { label: string; action: () => void }[];
};

/**
 * COMPONENTE: ChatWidget
 * 
 * PROPÓSITO: Widget de chat flotante con asistente virtual
 * 
 * ESTADOS:
 *   - isOpen: Si el panel de chat está abierto o cerrado
 *   - messages: Array de mensajes en la conversación
 *   - inputValue: Texto actual en el campo de entrada
 *   - isLoading: Si el bot está "escribiendo" (muestra animación de puntos)
 */
export const ChatWidget = () => {
  // Control de visibilidad del panel de chat
  const [isOpen, setIsOpen]       = useState(false);
  // Historial de mensajes de la conversación
  const [messages, setMessages]   = useState<Message[]>([]);
  // Valor del input de texto
  const [inputValue, setInputValue] = useState("");
  // Estado de carga (animación de "escribiendo...")
  const [isLoading, setIsLoading] = useState(false);
  // Referencia al final de los mensajes (para auto-scroll)
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Hook de toast (para posibles notificaciones futuras)
  const { toast } = useToast();

  // Token JWT del usuario (se lee de localStorage)
  const token = localStorage.getItem("token");

  /**
   * FUNCIÓN: addMessage
   * 
   * PROPÓSITO: Agrega un nuevo mensaje al historial de conversación
   * 
   * FLUJO:
   *   1. Recibe el mensaje sin ID
   *   2. Genera un ID aleatorio único
   *   3. Agrega al array de mensajes
   * 
   * @param msg - Mensaje a agregar (sin ID, se genera automáticamente)
   */
  const addMessage = (msg: Omit<Message, "id">) => {
    setMessages(prev => [...prev, { ...msg, id: Math.random().toString(36).substring(7) }]);
  };

  /**
   * FUNCIÓN: showTypingAndRespond
   * 
   * PROPÓSITO: Simula que el bot está "escribiendo" antes de responder
   * 
   * FLUJO:
   *   1. Activa indicador de carga (puntos animados)
   *   2. Espera el delay especificado (600ms por defecto)
   *   3. Desactiva indicador y ejecuta el callback de respuesta
   * 
   * @param callback - Función a ejecutar después del delay (la respuesta del bot)
   * @param delay - Milisegundos a esperar (simula tiempo de escritura)
   */
  const showTypingAndRespond = (callback: () => void, delay = 600) => {
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); callback(); }, delay);
  };

  /**
   * FUNCIÓN: handleInitialGreeting
   * 
   * PROPÓSITO: Muestra el mensaje de bienvenida cuando se abre el chat por primera vez
   * 
   * FLUJO:
   *   1. Agrega mensaje de saludo del bot
   *   2. Incluye 3 opciones: Ver Salones, Tutorías Disponibles, Mis Tutorías
   *   3. Cada opción tiene una acción que ejecuta la función correspondiente
   */
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

  /**
   * EFECTO: Saludo inicial al abrir el chat
   * 
   * Se ejecuta cuando isOpen cambia. Si se abre y no hay mensajes,
   * muestra el saludo de bienvenida.
   */
  useEffect(() => {
    if (isOpen && messages.length === 0) handleInitialGreeting();
  }, [isOpen]);

  /**
   * EFECTO: Auto-scroll al último mensaje
   * 
   * Cada vez que se agrega un mensaje o cambia el estado de carga,
   * hace scroll suave al final de la lista de mensajes.
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  /**
   * FUNCIÓN: handleSelection
   * 
   * PROPÓSITO: Maneja cuando el usuario selecciona una opción del bot
   * 
   * FLUJO:
   *   1. Agrega el texto seleccionado como mensaje del usuario
   *   2. Muestra animación de "escribiendo" y ejecuta la función de acción
   * 
   * @param text - Texto de la opción seleccionada (se muestra como mensaje del usuario)
   * @param actionFn - Función a ejecutar (consulta API correspondiente)
   */
  const handleSelection = (text: string, actionFn: () => void) => {
    addMessage({ text, sender: "user" });
    showTypingAndRespond(actionFn);
  };

  // ── Funciones de consulta a la API ──────────────────────────────────────

  /**
   * FUNCIÓN: fetchRooms
   * 
   * PROPÓSITO: Consulta y muestra los salones registrados
   * 
   * FLUJO:
   *   1. GET /auth/rooms con token de autenticación
   *   2. Si no hay salones: muestra mensaje informativo
   *   3. Si hay salones: muestra lista con nombre, edificio y capacidad
   *   4. Al final, muestra menú de opciones nuevamente
   */
  const fetchRooms = async () => {
    try {
      const res = await fetch("/auth/rooms", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const rooms = await res.json();
      if (rooms.length === 0) {
        addMessage({ text: "Actualmente no hay salones registrados.", sender: "bot" });
      } else {
        // Renderiza lista de salones como JSX dentro del mensaje
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

  /**
   * FUNCIÓN: fetchTutorias
   * 
   * PROPÓSITO: Consulta tutorías disponibles y permite inscribirse
   * 
   * FLUJO:
   *   1. GET /auth/sessions con token de autenticación
   *   2. Si no hay sesiones: muestra mensaje y menú
   *   3. Si hay sesiones: muestra lista con botones para inscribirse
   *   4. Cada botón ejecuta enrollTutoria() con el ID de la sesión
   */
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
      // Muestra cada sesión como opción seleccionable
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

  /**
   * FUNCIÓN: enrollTutoria
   * 
   * PROPÓSITO: Inscribe al estudiante en una sesión de tutoría específica
   * 
   * FLUJO:
   *   1. POST /auth/sessions/{id}/enroll con token de autenticación
   *   2. Si exitoso: muestra mensaje de éxito con emoji 🎉
   *   3. Si error: muestra mensaje con detalle del error
   *   4. Al final, muestra menú de opciones
   * 
   * @param sessionId - ID de la sesión a inscribirse
   */
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

  /**
   * FUNCIÓN: fetchMyTutorias
   * 
   * PROPÓSITO: Muestra las tutorías en las que el estudiante está inscrito
   * 
   * FLUJO:
   *   1. GET /auth/student/enrolled-sessions con token
   *   2. Si no hay inscripciones: muestra mensaje informativo
   *   3. Si hay inscripciones: muestra lista con materia, fecha, tutor y salón
   *   4. Al final, muestra menú de opciones
   */
  const fetchMyTutorias = async () => {
    try {
      const res = await fetch("/auth/student/enrolled-sessions", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const sessions = await res.json();
      if (sessions.length === 0) {
        addMessage({ text: "No tienes tutorías inscritas actualmente.", sender: "bot" });
      } else {
        // Renderiza lista de tutorías inscritas como JSX
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

  /**
   * FUNCIÓN: showMenuOptions
   * 
   * PROPÓSITO: Muestra el menú principal de opciones después de una respuesta
   * 
   * FLUJO:
   *   1. Espera 1 segundo (para dar tiempo a leer la respuesta anterior)
   *   2. Agrega mensaje del bot con las 3 opciones principales
   */
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

  /**
   * FUNCIÓN: handleSendText
   * 
   * PROPÓSITO: Maneja el envío de texto libre por el usuario
   * 
   * FLUJO:
   *   1. Previene recarga de la página (form submit)
   *   2. Si el input está vacío, no hace nada
   *   3. Agrega el texto como mensaje del usuario
   *   4. Limpia el input
   *   5. Muestra respuesta del bot indicando que use los botones
   *   6. Muestra menú de opciones
   * 
   * NOTA: El chatbot no procesa lenguaje natural, solo funciona con botones
   */
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
      {/* ── Panel de Chat (visible cuando isOpen=true) ── */}
      {isOpen && (
        <div className="w-[350px] sm:w-[380px] h-[500px] max-h-[80vh] bg-background border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in slide-in-from-bottom-5">

          {/* ── Header del chat ── */}
          {/* Gradiente institucional UNAB: azul → púrpura */}
          <div className="flex items-center justify-between px-4 py-3 text-white"
            style={{ background: "linear-gradient(135deg, #00AEEF 0%, #0090C5 60%, #6B2D8B 100%)" }}>
            <div className="flex items-center gap-2">
              {/* Icono de graduación */}
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/20">
                <GraduationCap size={15} className="text-white" />
              </div>
              {/* Título y subtítulo */}
              <div className="leading-tight">
                <p className="text-sm font-semibold leading-none">Asistente Virtual</p>
                <p className="text-[10px] text-white/70 leading-none mt-0.5">UNAB Tutorías</p>
              </div>
            </div>
            {/* Botón para cerrar el chat */}
            <button onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/20 transition-colors">
              <X size={15} />
            </button>
          </div>

          {/* ── Área de mensajes ── */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
            {messages.map(msg => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                {/* Burbuja del mensaje */}
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "bg-[#00AEEF] text-white rounded-br-sm"          // Mensaje del usuario: azul, alineado a la derecha
                    : "bg-card border border-border/60 shadow-sm rounded-bl-sm text-foreground"  // Mensaje del bot: fondo claro, alineado a la izquierda
                }`}>
                  {msg.text}
                </div>
                {/* Botones de opciones (si los tiene) */}
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

            {/* Indicador de "escribiendo..." (3 puntos animados) */}
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
            {/* Referencia para auto-scroll al final */}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Campo de entrada de texto ── */}
          <form onSubmit={handleSendText} className="p-3 bg-background border-t border-border/60 flex gap-2 items-center">
            <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="flex-1 px-3 py-2 bg-muted/40 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/40" />
            {/* Botón de enviar (deshabilitado si el input está vacío) */}
            <button type="submit" disabled={!inputValue.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00AEEF] hover:bg-[#0090C5] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              <Send size={15} className="ml-0.5" />
            </button>
          </form>
        </div>
      )}

      {/* ── Botón flotante para abrir/cerrar el chat ── */}
      {/* Siempre visible en la esquina inferior derecha */}
      <button onClick={() => setIsOpen(!isOpen)}
        className="h-14 w-14 rounded-full text-white shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ background: "linear-gradient(135deg, #00AEEF, #6B2D8B)" }}>
        {/* Cambia icono: flecha abajo cuando está abierto, burbuja cuando está cerrado */}
        {isOpen ? <ChevronDown size={22} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
};