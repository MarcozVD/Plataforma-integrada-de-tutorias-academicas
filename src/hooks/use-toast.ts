/**
 * ════════════════════════════════════════════════════════════════════════════════
 * HOOK: useToast - Sistema de Notificaciones Toast
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Hook React que proporciona un sistema de notificaciones tipo "toast".
 *   Maneja una cola de notificaciones con máximo 1 toast visible a la vez.
 *   Permite crear, actualizar, descartar y remover toasts.
 * 
 * ARQUITECTURA:
 *   - Reducer pattern: Gestiona estado de toasts con acciones
 *   - Memory state: Estado global (no vinculado a React inicialmente)
 *   - Listeners: Array de funciones que escuchan cambios de estado
 *   - Timeouts: Map para manejar auto-remover de toasts
 * 
 * FLUJO GENERAL:
 *   1. dispatch(action) actualiza memoryState y notifica listeners
 *   2. useToast() hook se subscribe a cambios con listener
 *   3. toast() función crea nuevo toast con ID único
 *   4. Toast se auto-remueve después de TOAST_REMOVE_DELAY
 *   5. Si usuario cierra toast antes, se descarta inmediatamente
 * 
 * USO:
 *   const { toast } = useToast();
 *   toast({
 *     title: "Éxito",
 *     description: "Tu acción se completó",
 *     variant: "default" // o "destructive"
 *   });
 */

import * as React from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * CONFIGURACIÓN GLOBAL
 * ════════════════════════════════════════════════════════════════════════════════
 */

/** 
 * CONSTANTE: TOAST_LIMIT
 * 
 * Máximo número de toasts que pueden estar visibles simultáneamente.
 * Valor: 1 (solo uno a la vez para evitar clutter en UI)
 */
const TOAST_LIMIT = 1;

/**
 * CONSTANTE: TOAST_REMOVE_DELAY
 * 
 * Tiempo en milisegundos antes de auto-remover un toast.
 * Valor: 1000000 ms (~16 minutos)
 * 
 * NOTA: Este valor es muy largo. En producción, probablemente debería ser
 * algo como 5000 ms (5 segundos) o configurable por toast.
 */
const TOAST_REMOVE_DELAY = 1000000;

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * TYPES Y INTERFACES
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * TYPE: ToasterToast
 * 
 * PROPÓSITO: Representa un toast completo en el sistema
 * 
 * ESTRUCTURA:
 *   - Extiende ToastProps (propiedades de Shadcn Toast component)
 *   - id: Identificador único del toast
 *   - title: Título del toast
 *   - description: Descripción/mensaje
 *   - action: Botón de acción opcional
 */
type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

/**
 * OBJETO: actionTypes
 * 
 * PROPÓSITO: Define tipos de acciones para el reducer
 * 
 * ACCIONES:
 *   - ADD_TOAST: Agrega un nuevo toast a la cola
 *   - UPDATE_TOAST: Actualiza propiedades de un toast existente
 *   - DISMISS_TOAST: Marca un toast como cerrado (inicializa timeout para remover)
 *   - REMOVE_TOAST: Remueve permanentemente un toast de la memoria
 */
const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

/**
 * VARIABLE: count
 * 
 * PROPÓSITO: Contador para generar IDs únicos de toasts
 * 
 * Incrementa cada vez que se crea un nuevo toast.
 */
let count = 0;

/**
 * FUNCIÓN: genId
 * 
 * PROPÓSITO: Genera un ID único para cada toast
 * 
 * FLUJO:
 *   1. Incrementa count (circular: vuelve a 0 en MAX_SAFE_INTEGER)
 *   2. Convierte a string y retorna
 * 
 * @returns String con ID único (numérico convertido a string)
 * 
 * EJEMPLO:
 *   genId() // "1"
 *   genId() // "2"
 *   genId() // "3"
 */
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

/**
 * TYPE: ActionType
 * 
 * PROPÓSITO: Type helper para las acciones del reducer
 * 
 * Se usa para tipado de las acciones discriminadas (union types)
 */
type ActionType = typeof actionTypes;

/**
 * TYPE: Action (Union discriminada)
 * 
 * PROPÓSITO: Define todos los tipos de acciones posibles para el reducer
 * 
 * ACCIONES:
 *   1. ADD_TOAST: { type: "ADD_TOAST", toast: ToasterToast }
 *      - Agrega nuevo toast a la lista
 *   
 *   2. UPDATE_TOAST: { type: "UPDATE_TOAST", toast: Partial<ToasterToast> }
 *      - Actualiza campos de un toast existente
 *   
 *   3. DISMISS_TOAST: { type: "DISMISS_TOAST", toastId?: string }
 *      - Marca como cerrado y programa para remover
 *      - Si toastId es undefined, cierra todos
 *   
 *   4. REMOVE_TOAST: { type: "REMOVE_TOAST", toastId?: string }
 *      - Remueve permanentemente
 *      - Si toastId es undefined, limpia todo
 */
type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

/**
 * INTERFACE: State
 * 
 * PROPÓSITO: Estado global del sistema de toasts
 * 
 * ESTRUCTURA:
 *   - toasts: Array de toasts activos en memoria
 */
interface State {
  toasts: ToasterToast[];
}

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * ESTADO GLOBAL Y TIMEOUTS
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * VARIABLE: toastTimeouts
 * 
 * PROPÓSITO: Map que almacena timeouts para auto-remover toasts
 * 
 * CLAVE: ID del toast
 * VALOR: ReturnType del setTimeout
 * 
 * Se usa para:
 *   - Evitar duplicar timeouts para el mismo toast
 *   - Poder cancelar timeouts si es necesario
 */
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

/**
 * FUNCIÓN: addToRemoveQueue
 * 
 * PROPÓSITO: Programa auto-remover de un toast después de TOAST_REMOVE_DELAY
 * 
 * PARÁMETROS:
 *   - toastId: ID del toast a remover
 * 
 * FLUJO:
 *   1. Si ya existe timeout para este toast: retorna (evita duplicados)
 *   2. Crea setTimeout que ejecutará REMOVE_TOAST después de delay
 *   3. Guarda timeout en map para referencia futura
 *   4. Al ejecutar: limpia map, dispatchea REMOVE_TOAST
 * 
 * NOTA: Si se llama múltiples veces con mismo ID, solo crea un timeout
 */
const addToRemoveQueue = (toastId: string) => {
  // Evitar crear múltiples timeouts para el mismo toast
  if (toastTimeouts.has(toastId)) {
    return;
  }

  // Crear timeout que ejecuta REMOVE_TOAST después del delay
  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  // Guardar referencia al timeout
  toastTimeouts.set(toastId, timeout);
};

/**
 * VARIABLE: listeners
 * 
 * PROPÓSITO: Array de funciones que se ejecutan cuando cambia el estado
 * 
 * Patrón pub-sub manual (similar a Redux):
 *   1. Componentes se "subscriben" agregando función a listeners
 *   2. Cuando dispatch() es llamado, notifica todos los listeners
 *   3. Listeners actualizan state local del componente
 * 
 * TYPE: Array<(state: State) => void>
 */
const listeners: Array<(state: State) => void> = [];

/**
 * VARIABLE: memoryState
 * 
 * PROPÓSITO: Estado global único en memoria (no en React)
 * 
 * Esta es la fuente única de verdad para todos los toasts.
 * Se inicializa como empty: { toasts: [] }
 * 
 * NOTA: No es state de React, es un objeto plano que persiste entre renders
 */
let memoryState: State = { toasts: [] };

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * REDUCER Y DISPATCH
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * FUNCIÓN: dispatch
 * 
 * PROPÓSITO: Ejecuta una acción y notifica a todos los listeners
 * 
 * PARÁMETROS:
 *   - action: Acción a ejecutar (ADD_TOAST, UPDATE_TOAST, etc)
 * 
 * FLUJO:
 *   1. Llama reducer(memoryState, action) para obtener nuevo estado
 *   2. Actualiza memoryState
 *   3. Notifica todos los listeners llamándolos con nuevo estado
 * 
 * PATRÓN: Pub-Sub manual (notificación a subscribers)
 */
function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * FUNCIÓN: reducer
 * 
 * PROPÓSITO: Maneja cambios de estado según la acción
 * 
 * PARÁMETROS:
 *   - state: Estado actual
 *   - action: Acción a aplicar
 * 
 * RETORNA: Nuevo estado después de aplicar acción
 * 
 * ════════════════════════════════════════════════════════════════════════════════
 * CASOS (Switch):
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * 1. ADD_TOAST:
 *    - Agrega toast al principio del array
 *    - Limita a máximo TOAST_LIMIT toasts (slice(0, 1))
 *    - Esto descarta toasts más antiguos si hay overflow
 * 
 * 2. UPDATE_TOAST:
 *    - Busca toast con ID coincidente
 *    - Merge propiedades (spread operator)
 *    - Deja otros toasts sin cambios
 * 
 * 3. DISMISS_TOAST:
 *    - IMPORTANTE: Este caso tiene side effects (addToRemoveQueue)
 *    - Si toastId especificado: programa remover solo ese
 *    - Si toastId undefined: programa remover todos
 *    - Marca open=false (cierra visualmente)
 * 
 * 4. REMOVE_TOAST:
 *    - Si toastId undefined: limpia todo (toasts = [])
 *    - Si toastId especificado: filtra ese ID
 *    - Remover es permanente (diferente a dismiss)
 */
export const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ADD_TOAST: Agrega nuevo toast a la cola
    // ═══════════════════════════════════════════════════════════════════════════
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      };

    // ═══════════════════════════════════════════════════════════════════════════
    // UPDATE_TOAST: Actualiza propiedades de toast existente
    // ═══════════════════════════════════════════════════════════════════════════
    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) => 
          (t.id === action.toast.id ? { ...t, ...action.toast } : t)
        ),
      };

    // ═══════════════════════════════════════════════════════════════════════════
    // DISMISS_TOAST: Marca como cerrado e inicia countdown para remover
    // ═══════════════════════════════════════════════════════════════════════════
    case "DISMISS_TOAST": {
      const { toastId } = action;

      // SIDE EFFECT: Programar remoción automática
      // Si se especificó ID, remueve solo ese; si no, remueve todos
      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      // Actualizar estado: marcar como closed (open = false)
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false }
            : t,
        ),
      };
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // REMOVE_TOAST: Remueve permanentemente un toast
    // ═══════════════════════════════════════════════════════════════════════════
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        // Si no especificó ID, limpia todo
        return { ...state, toasts: [] };
      }
      // Si especificó ID, filtra ese toast
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

/**
 * ════════════════════════════════════════════════════════════════════════════════
 * FUNCIONES PÚBLICAS: toast() y useToast()
 * ════════════════════════════════════════════════════════════════════════════════
 */

/**
 * FUNCIÓN: toast
 * 
 * PROPÓSITO: Crea un nuevo toast y lo agrega a la cola
 * 
 * PARÁMETROS:
 *   - ...props: Propiedades del toast (title, description, variant, etc)
 * 
 * RETORNA: Objeto con control del toast
 *   - id: ID único del toast
 *   - dismiss: Función para cerrar el toast
 *   - update: Función para actualizar propiedades
 * 
 * FLUJO:
 *   1. Genera ID único
 *   2. Define funciones de update y dismiss
 *   3. Dispatchea ADD_TOAST con todo incluido
 *   4. Retorna ID y funciones de control
 * 
 * EJEMPLO:
 *   const { id, dismiss, update } = toast({
 *     title: "Guardando...",
 *     description: "Espera un momento"
 *   });
 *   
 *   // Después actualizar
 *   update({
 *     id,
 *     title: "¡Guardado!",
 *     description: "Todo se guardó correctamente"
 *   });
 *   
 *   // O cerrar
 *   dismiss();
 */
type Toast = Omit<ToasterToast, "id">;

function toast({ ...props }: Toast) {
  // Generar ID único
  const id = genId();

  // Función para actualizar: dispatchea UPDATE_TOAST
  const update = (props: ToasterToast) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  // Función para cerrar: dispatchea DISMISS_TOAST
  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  // Agregar toast inicial
  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      // Cuando el usuario cierra el toast manualmente, ejecuta dismiss()
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  // Retornar control del toast al llamador
  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * HOOK: useToast
 * 
 * PROPÓSITO: Hook React para acceder y controlar el sistema de toasts
 * 
 * RETORNA: Objeto con:
 *   - ...state: toasts array y propiedades
 *   - toast(): Función para crear nuevo toast
 *   - dismiss(): Función para cerrar toast(s)
 * 
 * FLUJO:
 *   1. useState inicializa con memoryState actual
 *   2. useEffect agrega listener a cambios globales
 *   3. Cuando dispatch() es llamado, listener actualiza componente
 *   4. useEffect cleanup remueve listener (evita memory leaks)
 * 
 * PATRÓN: Suscripción a estado global (similar a Redux hooks)
 * 
 * EJEMPLO DE USO:
 *   function MiComponente() {
 *     const { toast, toasts } = useToast();
 *     
 *     const handleSave = async () => {
 *       try {
 *         await api.save();
 *         toast({
 *           title: "¡Éxito!",
 *           description: "Datos guardados"
 *         });
 *       } catch (err) {
 *         toast({
 *           variant: "destructive",
 *           title: "Error",
 *           description: "No se pudo guardar"
 *         });
 *       }
 *     };
 *     
 *     return <button onClick={handleSave}>Guardar</button>;
 *   }
 */
function useToast() {
  // Estado React local que refleja memoryState global
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    // Agregar este componente como listener
    // Cuando dispatch() es llamado, setState será ejecutado con nuevo estado
    listeners.push(setState);

    // Cleanup: remover listener cuando componente se desmonta
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  // Retornar estado y funciones de control
  return {
    ...state,  // Spread: toasts, etc
    toast,
    dismiss: (toastId?: string) => 
      dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

/**
 * EXPORTAR: Funciones públicas
 * 
 * - useToast: Hook para usar en componentes React
 * - toast: Función para crear toast fuera de componentes (si es necesario)
 */
export { useToast, toast };
