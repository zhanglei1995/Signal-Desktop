// Copyright 2026 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { BrowserWindow, WebContents } from 'electron';

import type { ConfigType } from './base_config.node.ts';
import type { MainSQL } from '../ts/sql/main.main.ts';

export type AccountRuntimeId = string;

export type AccountRuntime = Readonly<{
  id: AccountRuntimeId;
  label: string;
  appInstance: string | undefined;
  storageProfile: string | undefined;
  userDataPath: string;
  userConfig: ConfigType;
  ephemeralConfig: ConfigType;
  sql: MainSQL;
  getWindow: () => BrowserWindow | undefined;
  setWindow: (window: BrowserWindow | undefined) => void;
}>;

export type AccountRuntimeOptions = Readonly<{
  id: AccountRuntimeId;
  label: string;
  appInstance?: string;
  storageProfile?: string;
  userDataPath: string;
  userConfig: ConfigType;
  ephemeralConfig: ConfigType;
  sql: MainSQL;
}>;

const runtimesById = new Map<AccountRuntimeId, AccountRuntime>();
const runtimeIdByWebContentsId = new Map<number, AccountRuntimeId>();

let primaryRuntimeId: AccountRuntimeId | undefined;

export function createAccountRuntime({
  id,
  label,
  appInstance,
  storageProfile,
  userDataPath,
  userConfig,
  ephemeralConfig,
  sql,
}: AccountRuntimeOptions): AccountRuntime {
  let window: BrowserWindow | undefined;

  return {
    id,
    label,
    appInstance,
    storageProfile,
    userDataPath,
    userConfig,
    ephemeralConfig,
    sql,
    getWindow: () => window,
    setWindow: nextWindow => {
      window = nextWindow;
    },
  };
}

export function registerPrimaryAccountRuntime(
  runtime: AccountRuntime
): AccountRuntime {
  if (primaryRuntimeId != null && primaryRuntimeId !== runtime.id) {
    throw new Error(
      `Primary account runtime already registered: ${primaryRuntimeId}`
    );
  }

  primaryRuntimeId = runtime.id;
  runtimesById.set(runtime.id, runtime);

  return runtime;
}

export function registerAccountRuntime(runtime: AccountRuntime): AccountRuntime {
  if (runtimesById.has(runtime.id)) {
    throw new Error(`Account runtime already registered: ${runtime.id}`);
  }

  runtimesById.set(runtime.id, runtime);

  return runtime;
}

export function unregisterAccountRuntime(runtime: AccountRuntime): void {
  if (primaryRuntimeId === runtime.id) {
    throw new Error('Cannot unregister primary account runtime');
  }

  runtimesById.delete(runtime.id);
  runtime.setWindow(undefined);
}

export function getPrimaryAccountRuntime(): AccountRuntime {
  if (primaryRuntimeId == null) {
    throw new Error('Primary account runtime has not been registered');
  }

  const runtime = runtimesById.get(primaryRuntimeId);
  if (!runtime) {
    throw new Error(`Primary account runtime missing: ${primaryRuntimeId}`);
  }

  return runtime;
}

export function getAllAccountRuntimes(): ReadonlyArray<AccountRuntime> {
  return Array.from(runtimesById.values());
}

export function getAccountRuntimeById(
  id: AccountRuntimeId
): AccountRuntime | undefined {
  return runtimesById.get(id);
}

export function registerAccountWindow(
  runtime: AccountRuntime,
  window: BrowserWindow
): void {
  const webContentsId = window.webContents.id;

  runtime.setWindow(window);
  runtimeIdByWebContentsId.set(webContentsId, runtime.id);

  window.on('closed', () => {
    runtimeIdByWebContentsId.delete(webContentsId);
    if (runtime.getWindow() === window) {
      runtime.setWindow(undefined);
    }
  });
}

export function setAccountRuntimeForWindow(
  runtime: AccountRuntime,
  window: BrowserWindow
): void {
  const previousRuntime = getAccountRuntimeForWebContents(window.webContents);
  if (previousRuntime !== runtime && previousRuntime.getWindow() === window) {
    previousRuntime.setWindow(undefined);
  }

  runtime.setWindow(window);
  runtimeIdByWebContentsId.set(window.webContents.id, runtime.id);
}

export function getAccountRuntimeForWebContents(
  webContents: WebContents | undefined
): AccountRuntime {
  if (webContents != null) {
    const runtimeId = runtimeIdByWebContentsId.get(webContents.id);
    if (runtimeId != null) {
      const runtime = runtimesById.get(runtimeId);
      if (runtime) {
        return runtime;
      }
    }
  }

  return getPrimaryAccountRuntime();
}

export function getAccountRuntimeForEvent(
  event: Readonly<{ sender: WebContents }>
): AccountRuntime {
  return getAccountRuntimeForWebContents(event.sender);
}
