const { contextBridge, ipcRenderer } = require('electron');

// Экспортируем безопасные API в рендер-процесс
contextBridge.exposeInMainWorld('api', {
  // Конфигурация
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  
  // VPN управление
  connectVPN: (config) => ipcRenderer.invoke('connect-vpn', config),
  disconnectVPN: () => ipcRenderer.invoke('disconnect-vpn'),
  getVPNStatus: () => ipcRenderer.invoke('get-vpn-status'),
  
  // События
  onAutoConnect: (callback) => ipcRenderer.on('auto-connect', callback),
  onVPNConnect: (callback) => ipcRenderer.on('connect-vpn', callback),
  onVPNDisconnect: (callback) => ipcRenderer.on('disconnect-vpn', callback),
  
  // Утилиты
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  // Показать сообщение
  showMessage: (title, message) => ipcRenderer.send('show-message', { title, message })
});