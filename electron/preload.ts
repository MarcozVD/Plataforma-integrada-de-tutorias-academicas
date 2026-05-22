/**
 * ════════════════════════════════════════════════════════════════════════════════
 * PRELOAD SCRIPT - Electron Context Bridge
 * ════════════════════════════════════════════════════════════════════════════════
 * 
 * PROPÓSITO:
 *   Script que corre en contexto de Electron (acceso a APIs nativas) pero
 *   en el sandbox de seguridad. Expone de forma segura funciones IPC al renderer.
 * 
 * SEGURIDAD:
 *   - El renderer process NO puede acceder directamente a ipcRenderer
 *   - El preload usa contextBridge para exponer solo lo necesario
 *   - Esto previene ataques XSS donde se intenta acceder a APIs natales
 * 
 * FLUJO:
 *   1. Preload corre en contexto de Node/Electron
 *   2. contextBridge.exposeInMainWorld expone API al renderer
 *   3. Renderer accede a window.ipcRenderer.send(), etc
 *   4. IPC comunica entre renderer y main process
 */

import { ipcRenderer, contextBridge } from 'electron'

/**
 * EXPOSICIÓN DE IPC AL RENDERER PROCESS
 * 
 * Expone ipcRenderer de forma segura al proceso renderer
 * El renderer puede usar: window.ipcRenderer para:
 *   - on(channel, listener): Escuchar mensajes
 *   - off(channel, listener): Dejar de escuchar
 *   - send(channel, ...args): Enviar mensaje al main process
 *   - invoke(channel, ...args): Llamada async al main process
 */
contextBridge.exposeInMainWorld('ipcRenderer', {
  /**
   * on - Escucha eventos del main process
   * 
   * Uso:
   *   window.ipcRenderer.on('evento', (event, ...args) => {...})
   */
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  
  /**
   * off - Deja de escuchar eventos
   * 
   * Uso:
   *   window.ipcRenderer.off('evento', listener)
   */
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  
  /**
   * send - Envía mensaje asincrónico al main process
   * 
   * Uso:
   *   window.ipcRenderer.send('window-controls', 'minimize')
   */
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  
  /**
   * invoke - Llamada RPC al main process (espera respuesta)
   * 
   * Uso:
   *   const result = await window.ipcRenderer.invoke('get-data')
   */
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})
