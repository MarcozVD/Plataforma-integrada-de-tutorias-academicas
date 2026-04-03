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
    <div className="flex flex-col w-full z-50 shadow-sm relative">
      {/* Banda UNAB Institucional */}
      <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #00AEEF, #0090C5, #6B2D8B)" }} />
      
      <div 
        className="flex justify-between items-center bg-[#0090C5] text-white select-none w-full h-8"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="flex items-center pl-4 text-xs font-semibold text-white/90">
          PITA Tutorías
        </div>
        
        {/* Controles de ventana */}
        <div className="flex h-full" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button 
            onClick={() => handleControl('minimize')} 
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 transition-colors"
          >
            <Minus className="w-3.5 h-3.5 text-white/90" />
          </button>
          <button 
            onClick={() => handleControl('maximize')} 
            className="flex items-center justify-center w-12 h-full hover:bg-white/15 transition-colors"
          >
            <Square className="w-3 h-3 text-white/90" />
          </button>
          <button 
            onClick={() => handleControl('close')} 
            className="flex items-center justify-center w-12 h-full hover:bg-red-500 hover:text-white transition-colors"
          >
            <X className="w-3.5 h-3.5 text-white/90" />
          </button>
        </div>
      </div>
    </div>
  );
};
