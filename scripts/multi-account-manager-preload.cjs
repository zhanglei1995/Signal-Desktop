// Copyright 2026 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('multiAccountManager', {
  getState: () => ipcRenderer.invoke('manager:get-state'),
  start: id => ipcRenderer.invoke('manager:start', id),
  stop: id => ipcRenderer.invoke('manager:stop', id),
  restart: id => ipcRenderer.invoke('manager:restart', id),
  focus: id => ipcRenderer.invoke('manager:focus', id),
  ensureConfig: id => ipcRenderer.invoke('manager:ensure-config', id),
  ensureAllConfigs: () => ipcRenderer.invoke('manager:ensure-all-configs'),
  openProfileConfig: id => ipcRenderer.invoke('manager:open-profile-config', id),
  openDataPath: id => ipcRenderer.invoke('manager:open-data-path', id),
  openManagerConfig: () => ipcRenderer.invoke('manager:open-manager-config'),
  onState: callback => {
    const listener = (_event, state) => callback(state);
    ipcRenderer.on('manager:state', listener);
    return () => ipcRenderer.off('manager:state', listener);
  },
});
