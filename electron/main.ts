/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PROCESO PRINCIPAL DE ELECTRON
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Crea la ventana principal de la aplicación de escritorio.
 *   Maneja el ciclo de vida de la app (crear ventana, cerrar, minimizar).
 * 
 * FLUJO:
 *   1. Evento "ready": Crea ventana principal
 *   2. En desarrollo: Carga desde servidor Vite (localhost:5173)
 *   3. En producción: Carga HTML construido (dist/index.html)
 *   4. Eventos: Minimizar, maximizar, cerrar ventana
 *   5. Evento "window-all-closed": Sale de la app (excepto en macOS)
 */

import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * CONFIGURACIÓN DE RUTAS
 * 
 * APP_ROOT: Raíz del proyecto
 * VITE_DEV_SERVER_URL: URL del servidor Vite en desarrollo
 * MAIN_DIST: Donde está compilado el proceso main (dist-electron)
 * RENDERER_DIST: Donde está compilado el frontend (dist)
 * VITE_PUBLIC: Carpeta public o dist según si es dev o producción
 */
process.env.APP_ROOT = path.join(__dirname, '..')
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT!, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT!, 'dist')
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT!, 'public') : RENDERER_DIST

// Referencia global a la ventana (previene que se garbage collect)
let win: BrowserWindow | null

/**
 * FUNCIÓN: createWindow
 * 
 * PROPÓSITO: Crea la ventana principal de la aplicación
 * 
 * FLUJO:
 *   1. Crea BrowserWindow con configuración
 *   2. Sin frame del SO (custom title bar)
 *   3. Carga URL (dev server o HTML producción)
 *   4. Disables menu
 *   5. Configura IPC listeners para controles de ventana
 */
function createWindow() {
  // Crea ventana principal
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC!, 'logo-unab.svg'),  // Icono de ventana
    width: 1200,  // Ancho inicial
    height: 800,  // Alto inicial
    frame: false, // Sin frame del SO (uso custom title bar)
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),  // Script preload (acceso a IPC seguro)
      // Más preferencias de seguridad se pueden añadir aquí
    },
  })

  // Event: Cuando se termina de cargar
  win.webContents.on('did-finish-load', () => {
    // Envía mensaje al renderer process
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  // Desactiva el menú (sin menú de "Archivo, Editar, Ver, etc")
  win.setMenu(null)

  // En desarrollo: Carga desde servidor Vite
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // En producción: Carga desde archivo HTML compilado
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

/**
 * EVENTO: app "window-all-closed"
 * 
 * Cuando se cierran todas las ventanas:
 * - En Windows/Linux: Sale de la app completamente
 * - En macOS: Mantiene la app abierta (comportamiento estándar de macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

/**
 * EVENTO: app "activate"
 * 
 * En macOS: Cuando el usuario click el icono en dock
 * Reabre la ventana si está cerrada
 */
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

/**
 * IPC HANDLER: Controles de ventana
 * 
 * El renderer process puede enviar comandos para:
 *   - minimize: Minimizar ventana
 *   - maximize: Maximizar/restaurar ventana
 *   - close: Cerrar ventana
 */
ipcMain.on('window-controls', (event, action) => {
  const window = BrowserWindow.fromWebContents(event.sender)
  if (!window) return
  
  switch (action) {
    case 'minimize':
      window.minimize()
      break
    case 'maximize':
      if (window.isMaximized()) {
        window.restore()
      } else {
        window.maximize()
      }
      break
    case 'close':
      window.close()
      break
  }
})

/**
 * EVENTO: app "whenReady"
 * 
 * Cuando Electron está completamente listo
 * Crea la ventana principal
 */
app.whenReady().then(createWindow)
