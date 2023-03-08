// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
import { contextBridge, ipcRenderer } from 'electron'

// expose apis as window.electronAPI
contextBridge.exposeInMainWorld('electronAPI', {
  genKey: () => ipcRenderer.invoke('genKey'),
  keyRecov: (recovData: any) => ipcRenderer.invoke('keyRecov', recovData)
})