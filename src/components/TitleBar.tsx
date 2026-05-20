import { Minus, Square, X } from "lucide-react";

declare global {
  interface Window {
    ipcRenderer: any;
  }
}

export const TitleBar = () => {
  const handleControl = (action: 'minimize' | 'maximize' | 'close') => {
    // Comunicarse con el proceso principal a través del ipcRenderer expuesto
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-controls', action);
    }
  };

  return (
    <div className="flex flex-col w-full z-50 relative shrink-0">
      {/* Banda institucional — más sutil en dark */}
      <div
        className="h-0.5 w-full opacity-100 dark:opacity-40"
        style={{ background: "linear-gradient(90deg, #00AEEF, #0090C5, #6B2D8B)" }}
      />

      <div
        className="flex justify-between items-center bg-[#0090C5] dark:bg-[#0d1f2d] text-white select-none w-full h-8"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center pl-4 text-xs font-semibold text-white/80 dark:text-white/50 tracking-wide">
          PITA Tutorías
        </div>

        {/* Controles de ventana */}
        <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => handleControl('minimize')}
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 dark:hover:bg-white/8 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-white/70" />
          </button>
          <button
            onClick={() => handleControl('maximize')}
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 dark:hover:bg-white/8 transition-colors"
          >
            <Square className="w-3 h-3 text-white/70" />
          </button>
          <button
            onClick={() => handleControl('close')}
            className="flex items-center justify-center w-12 h-full hover:bg-red-500/80 dark:hover:bg-red-700/70 transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/70" />
          </button>
        </div>
      </div>
    </div>
  );
};
