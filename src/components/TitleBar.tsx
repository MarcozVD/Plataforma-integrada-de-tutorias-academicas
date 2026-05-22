/**
 * ════════════════════════════════════════════════════════════════════════════════
 * BARRA DE TÍTULO PERSONALIZADA - Electron
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Barra de título personalizada para la aplicación de Electron.
 *   Reemplaza la barra nativa del SO con controles: minimizar, maximizar, cerrar.
 * 
 * FLUJO:
 *   1. Renderiza barra con título "PITA Tutorías"
 *   2. Muestra 3 botones de control: minimizar, maximizar, cerrar
 *   3. Usa WebkitAppRegion para hacer el area draggable
 *   4. Comunica con main process vía IPC (window.ipcRenderer)
 * 
 * NOTA: Solo funciona en Electron, no en navegador web
 */

import { Minus, Square, X } from "lucide-react";

/**
 * TYPE DEFINITION: Extensión de window para IPC
 * 
 * Declara que window.ipcRenderer existe (expuesto por preload.ts)
 */
declare global {
  interface Window {
    ipcRenderer: any;
  }
}

/**
 * COMPONENTE: TitleBar
 * 
 * PROPÓSITO: Renderiza la barra de título de Electron con controles
 * 
 * ESTRUCTURA:
 *   - Banda colorida superior (gradiente institucional)
 *   - Barra oscura con título y botones de control
 * 
 * INTERACTIVIDAD:
 *   - Click en minimizar: minimiza ventana
 *   - Click en maximizar: maximiza/restaura ventana
 *   - Click en cerrar: cierra ventana
 *   - Drag en la barra: mueve ventana (WebkitAppRegion: drag)
 */
export const TitleBar = () => {
  
  /**
   * FUNCIÓN: handleControl
   * 
   * PROPÓSITO: Envía comando de control de ventana al main process
   * 
   * PARÁMETROS:
   *   - action: "minimize" | "maximize" | "close"
   * 
   * FLUJO:
   *   1. Verifica que window.ipcRenderer existe (en Electron)
   *   2. Envía comando al main process via IPC
   *   3. Main process ejecuta la acción en la BrowserWindow
   * 
   * NOTA: En navegador web, window.ipcRenderer no existe, así que no hace nada
   */
  const handleControl = (action: 'minimize' | 'maximize' | 'close') => {
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-controls', action);
    }
  };

  return (
    <div className="flex flex-col w-full z-50 relative shrink-0">
      
      {/* BANDA INSTITUCIONAL (Gradiente de colores UNAB) */}
      <div
        className="h-0.5 w-full opacity-100 dark:opacity-40"
        style={{ background: "linear-gradient(90deg, #00AEEF, #0090C5, #6B2D8B)" }}
      />

      {/* BARRA DE TÍTULO CON CONTROLES */}
      <div
        className="flex justify-between items-center bg-[#0090C5] dark:bg-[#0d1f2d] text-white select-none w-full h-8"
        // WebkitAppRegion: permite que el área sea draggable (para mover ventana)
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        
        {/* TÍTULO IZQUIERDA */}
        <div className="flex items-center pl-4 text-xs font-semibold text-white/80 dark:text-white/50 tracking-wide">
          PITA Tutorías
        </div>

        {/* BOTONES DE CONTROL DERECHA */}
        {/* WebkitAppRegion: no-drag = permite hacer click en estos botones */}
        <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          
          {/* BOTÓN: MINIMIZAR */}
          <button
            onClick={() => handleControl('minimize')}
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 dark:hover:bg-white/8 transition-colors"
            aria-label="Minimizar"
          >
            <Minus className="w-3.5 h-3.5 text-white/70" />
          </button>
          
          {/* BOTÓN: MAXIMIZAR/RESTAURAR */}
          <button
            onClick={() => handleControl('maximize')}
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 dark:hover:bg-white/8 transition-colors"
            aria-label="Maximizar"
          >
            <Square className="w-3 h-3 text-white/70" />
          </button>
          
          {/* BOTÓN: CERRAR */}
          <button
            onClick={() => handleControl('close')}
            className="flex items-center justify-center w-12 h-full hover:bg-red-500/80 dark:hover:bg-red-700/70 transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
};
