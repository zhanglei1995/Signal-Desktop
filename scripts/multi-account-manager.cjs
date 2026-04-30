// Copyright 2026 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

const { spawn } = require('node:child_process');
const { existsSync, mkdirSync, readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const { app, BrowserWindow, ipcMain, shell } = require('electron');

const rootDir = join(__dirname, '..');
const managerConfigPath = join(rootDir, 'config', 'multi-account-manager.json');
const managerConfigExamplePath = join(
  rootDir,
  'scripts',
  'multi-account-manager.config.example.json'
);

const DEFAULT_ACCOUNTS = [
  {
    id: 'alice',
    label: 'Alice',
    storageProfile: 'aliceProfile',
  },
  {
    id: 'bob',
    label: 'Bob',
    storageProfile: 'bobProfile',
  },
];

const ACCOUNT_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;
const processes = new Map();
const logs = new Map();

let mainWindow;
let broadcastTimer;
let viewportRequestTimer;
let viewportBounds;
let activeAccountId;

function loadAccounts() {
  let config = {};
  if (existsSync(managerConfigPath)) {
    config = JSON.parse(readFileSync(managerConfigPath, 'utf8'));
  }

  const accounts =
    Array.isArray(config.accounts) && config.accounts.length > 0
      ? config.accounts
      : DEFAULT_ACCOUNTS;

  return accounts.map(account => {
    if (!ACCOUNT_ID_PATTERN.test(account.id)) {
      throw new Error(
        `Invalid account id "${account.id}". Use letters, numbers, "_" or "-".`
      );
    }

    const storageProfile = account.storageProfile || `${account.id}Profile`;
    if (!ACCOUNT_ID_PATTERN.test(storageProfile)) {
      throw new Error(
        `Invalid storageProfile "${storageProfile}" for ${account.id}.`
      );
    }

    return {
      id: account.id,
      label: account.label || account.id,
      storageProfile,
      profileConfigPath: getProfileConfigPath(account.id),
      userDataPath: join(app.getPath('appData'), `Signal-${storageProfile}`),
    };
  });
}

function getProfileConfigPath(id) {
  return join(rootDir, 'config', `local-${id}.json`);
}

function getAccount(id) {
  const account = loadAccounts().find(item => item.id === id);
  if (!account) {
    throw new Error(`Unknown account "${id}"`);
  }
  return account;
}

function ensureProfileConfig(account) {
  const configPath = getProfileConfigPath(account.id);
  if (existsSync(configPath)) {
    return {
      created: false,
      path: configPath,
    };
  }

  mkdirSync(join(rootDir, 'config'), { recursive: true });
  writeFileSync(
    configPath,
    `${JSON.stringify({ storageProfile: account.storageProfile }, null, 2)}\n`
  );

  return {
    created: true,
    path: configPath,
  };
}

function appendLog(id, source, chunk) {
  const accountLog = logs.get(id) || [];
  const lines = chunk
    .toString()
    .split(/\r?\n/)
    .map(line => line.trimEnd())
    .filter(Boolean);

  for (const line of lines) {
    accountLog.push(`[${source}] ${line}`);
  }

  while (accountLog.length > 200) {
    accountLog.shift();
  }

  logs.set(id, accountLog);
  scheduleBroadcast();
}

function getProcessState(id) {
  const entry = processes.get(id);
  if (!entry) {
    return {
      status: 'stopped',
      pid: undefined,
      startedAt: undefined,
      exitCode: undefined,
    };
  }

  return {
    status: entry.status,
    pid: entry.child.pid,
    startedAt: entry.startedAt,
    exitCode: entry.exitCode,
  };
}

function getSnapshot() {
  return {
    configPath: managerConfigPath,
    exampleConfigPath: managerConfigExamplePath,
    accounts: loadAccounts().map(account => ({
      ...account,
      profileConfigExists: existsSync(getProfileConfigPath(account.id)),
      log: logs.get(account.id) || [],
      ...getProcessState(account.id),
    })),
  };
}

function broadcast() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }
  mainWindow.webContents.send('manager:state', getSnapshot());
}

function scheduleBroadcast() {
  clearTimeout(broadcastTimer);
  broadcastTimer = setTimeout(broadcast, 100);
}

function requestViewportBounds() {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  clearTimeout(viewportRequestTimer);
  viewportRequestTimer = setTimeout(() => {
    mainWindow.webContents.send('manager:viewport-request');
  }, 80);
}

function setViewportBounds(rect) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return getSnapshot();
  }

  const x = Number(rect?.x);
  const y = Number(rect?.y);
  const width = Number(rect?.width);
  const height = Number(rect?.height);

  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width < 1 ||
    height < 1
  ) {
    return getSnapshot();
  }

  const contentBounds = mainWindow.getContentBounds();
  const nextBounds = {
    x: Math.round(contentBounds.x + x),
    y: Math.round(contentBounds.y + y),
    width: Math.round(width),
    height: Math.round(height),
  };

  const changed =
    !viewportBounds ||
    viewportBounds.x !== nextBounds.x ||
    viewportBounds.y !== nextBounds.y ||
    viewportBounds.width !== nextBounds.width ||
    viewportBounds.height !== nextBounds.height;

  viewportBounds = nextBounds;

  if (changed) {
    syncActiveAccountWindow({ focus: false });
  }

  return getSnapshot();
}

function startAccount(id) {
  const existing = processes.get(id);
  if (existing?.status === 'running') {
    focusAccount(id);
    return getSnapshot();
  }

  const account = getAccount(id);
  const profileConfig = ensureProfileConfig(account);
  appendLog(
    id,
    'manager',
    `${profileConfig.created ? 'Created' : 'Using'} ${profileConfig.path}`
  );

  const child = spawn(process.execPath, [rootDir], {
    cwd: rootDir,
    env: {
      ...process.env,
      NODE_APP_INSTANCE: account.id,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: process.platform !== 'win32',
    windowsHide: false,
  });

  processes.set(id, {
    child,
    status: 'running',
    startedAt: new Date().toISOString(),
    exitCode: undefined,
  });

  appendLog(id, 'manager', `Started ${account.label} with pid ${child.pid}`);

  child.stdout.on('data', chunk => appendLog(id, 'stdout', chunk));
  child.stderr.on('data', chunk => appendLog(id, 'stderr', chunk));

  child.on('error', error => {
    const entry = processes.get(id);
    if (entry) {
      entry.status = 'error';
      entry.exitCode = undefined;
    }
    appendLog(id, 'manager', error.stack || error.message);
  });

  child.on('exit', code => {
    const entry = processes.get(id);
    if (entry) {
      entry.status = 'stopped';
      entry.exitCode = code;
    }
    appendLog(id, 'manager', `Exited with code ${code}`);
    scheduleBroadcast();
  });

  scheduleBroadcast();
  activeAccountId = id;
  scheduleAttachAttempts(id);
  return getSnapshot();
}

function stopAccount(id) {
  const entry = processes.get(id);
  if (!entry || entry.status !== 'running') {
    return getSnapshot();
  }

  const pid = entry.child.pid;
  appendLog(id, 'manager', `Stopping process tree ${pid}`);

  if (process.platform === 'win32') {
    spawn('taskkill.exe', ['/PID', String(pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      entry.child.kill('SIGTERM');
    }
  }

  return getSnapshot();
}

function restartAccount(id) {
  stopAccount(id);
  setTimeout(() => startAccount(id), 1500);
  return getSnapshot();
}

function quotePowerShellString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function getExpectedWindowTitle(account) {
  return `Signal - development - ${account.id}`;
}

function runPowerShell(command) {
  const child = spawn(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
    {
      windowsHide: true,
      stdio: 'ignore',
    }
  );

  child.on('error', () => {});
}

function getWin32WindowToolsCommand() {
  return `
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
using System.Text;

public static class SignalManagerWindowTools {
  private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

  [DllImport("user32.dll")]
  private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

  [DllImport("user32.dll")]
  private static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint processId);

  [DllImport("user32.dll")]
  private static extern bool IsWindowVisible(IntPtr hWnd);

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  private static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);

  [DllImport("user32.dll", CharSet = CharSet.Unicode)]
  private static extern int GetWindowTextLength(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);

  [DllImport("user32.dll")]
  public static extern bool SetForegroundWindow(IntPtr hWnd);

  [DllImport("user32.dll")]
  public static extern bool SetWindowPos(
    IntPtr hWnd,
    IntPtr hWndInsertAfter,
    int X,
    int Y,
    int cx,
    int cy,
    uint uFlags
  );

  public static IntPtr FindWindow(int processId, string expectedTitle) {
    IntPtr fallback = IntPtr.Zero;

    EnumWindows((hWnd, lParam) => {
      uint windowProcessId;
      GetWindowThreadProcessId(hWnd, out windowProcessId);
      if ((int)windowProcessId != processId || !IsWindowVisible(hWnd)) {
        return true;
      }

      int length = GetWindowTextLength(hWnd);
      if (length <= 0) {
        return true;
      }

      var title = new StringBuilder(length + 1);
      GetWindowText(hWnd, title, title.Capacity);
      string value = title.ToString();

      if (string.Equals(value, expectedTitle, StringComparison.OrdinalIgnoreCase)) {
        fallback = hWnd;
        return false;
      }

      if (fallback == IntPtr.Zero) {
        fallback = hWnd;
      }

      return true;
    }, IntPtr.Zero);

    return fallback;
  }
}
'@
`;
}

function getWin32AttachCommand(account, entry, bounds, { focus }) {
  const flags = focus ? '0x0040' : '(0x0040 -bor 0x0010)';

  return `${getWin32WindowToolsCommand()}
$hWnd = [SignalManagerWindowTools]::FindWindow(${entry.child.pid}, ${quotePowerShellString(
    getExpectedWindowTitle(account)
  )});

if ($hWnd -ne [IntPtr]::Zero) {
  [SignalManagerWindowTools]::ShowWindowAsync($hWnd, 9) | Out-Null;
  [SignalManagerWindowTools]::SetWindowPos(
    $hWnd,
    [IntPtr]::Zero,
    ${bounds.x},
    ${bounds.y},
    ${bounds.width},
    ${bounds.height},
    ${flags}
  ) | Out-Null;
  ${
    focus
      ? '[SignalManagerWindowTools]::SetForegroundWindow($hWnd) | Out-Null;'
      : ''
  }
}
`;
}

function getWin32MinimizeCommand(account, entry) {
  return `${getWin32WindowToolsCommand()}
$hWnd = [SignalManagerWindowTools]::FindWindow(${entry.child.pid}, ${quotePowerShellString(
    getExpectedWindowTitle(account)
  )});

if ($hWnd -ne [IntPtr]::Zero) {
  [SignalManagerWindowTools]::ShowWindowAsync($hWnd, 6) | Out-Null;
}
`;
}

function focusAccountFallback(id) {
  const account = getAccount(id);

  if (process.platform === 'win32') {
    const command = [
      '$shell = New-Object -ComObject WScript.Shell',
      `$null = $shell.AppActivate(${quotePowerShellString(
        getExpectedWindowTitle(account)
      )})`,
      `$null = $shell.AppActivate(${quotePowerShellString('Signal')})`,
    ].join('; ');

    runPowerShell(command);
  } else if (process.platform === 'darwin') {
    spawn('osascript', ['-e', 'tell application "Signal" to activate'], {
      stdio: 'ignore',
    });
  }

  return getSnapshot();
}

function hideInactiveAccountWindows(id) {
  if (process.platform !== 'win32') {
    return;
  }

  for (const [accountId, entry] of processes) {
    if (accountId === id || entry.status !== 'running') {
      continue;
    }

    runPowerShell(getWin32MinimizeCommand(getAccount(accountId), entry));
  }
}

function attachAccount(id, options = {}) {
  activeAccountId = id;
  hideInactiveAccountWindows(id);

  const entry = processes.get(id);
  if (!entry || entry.status !== 'running') {
    return getSnapshot();
  }

  if (process.platform !== 'win32' || !viewportBounds) {
    return focusAccountFallback(id);
  }

  runPowerShell(
    getWin32AttachCommand(getAccount(id), entry, viewportBounds, {
      focus: options.focus !== false,
    })
  );

  return getSnapshot();
}

function syncActiveAccountWindow(options = {}) {
  if (!activeAccountId) {
    return getSnapshot();
  }

  return attachAccount(activeAccountId, options);
}

function scheduleAttachAttempts(id) {
  [600, 1600, 3200, 5200].forEach(delay => {
    setTimeout(() => {
      if (activeAccountId === id) {
        attachAccount(id, { focus: delay >= 1600 });
      }
    }, delay);
  });
}

function focusAccount(id) {
  return attachAccount(id, { focus: true });
}

function openProfileConfig(id) {
  const account = getAccount(id);
  ensureProfileConfig(account);
  shell.showItemInFolder(getProfileConfigPath(id));
  return getSnapshot();
}

async function openDataPath(id) {
  const account = getAccount(id);
  mkdirSync(account.userDataPath, { recursive: true });
  await shell.openPath(account.userDataPath);
  return getSnapshot();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 980,
    height: 680,
    minWidth: 760,
    minHeight: 520,
    title: 'Signal Multi-Account Manager',
    backgroundColor: '#f6f7f9',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'multi-account-manager-preload.cjs'),
    },
  });

  mainWindow.loadURL(
    pathToFileURL(join(__dirname, 'multi-account-manager.html')).toString()
  );

  mainWindow.webContents.once('did-finish-load', requestViewportBounds);
  mainWindow.on('move', requestViewportBounds);
  mainWindow.on('resize', requestViewportBounds);
  mainWindow.on('restore', () => {
    requestViewportBounds();
    syncActiveAccountWindow({ focus: false });
  });
  mainWindow.on('minimize', () => {
    for (const [id, entry] of processes) {
      if (entry.status === 'running') {
        runPowerShell(getWin32MinimizeCommand(getAccount(id), entry));
      }
    }
  });
}

ipcMain.handle('manager:get-state', () => getSnapshot());
ipcMain.handle('manager:start', (_event, id) => startAccount(id));
ipcMain.handle('manager:stop', (_event, id) => stopAccount(id));
ipcMain.handle('manager:restart', (_event, id) => restartAccount(id));
ipcMain.handle('manager:focus', (_event, id) => focusAccount(id));
ipcMain.handle('manager:attach', (_event, id) => attachAccount(id));
ipcMain.handle('manager:set-viewport-bounds', (_event, rect) =>
  setViewportBounds(rect)
);
ipcMain.handle('manager:ensure-config', (_event, id) => {
  ensureProfileConfig(getAccount(id));
  return getSnapshot();
});
ipcMain.handle('manager:ensure-all-configs', () => {
  for (const account of loadAccounts()) {
    ensureProfileConfig(account);
  }
  return getSnapshot();
});
ipcMain.handle('manager:open-profile-config', (_event, id) =>
  openProfileConfig(id)
);
ipcMain.handle('manager:open-data-path', (_event, id) => openDataPath(id));
ipcMain.handle('manager:open-manager-config', () => {
  if (existsSync(managerConfigPath)) {
    shell.showItemInFolder(managerConfigPath);
  } else {
    shell.showItemInFolder(managerConfigExamplePath);
  }
  return getSnapshot();
});

app.whenReady().then(createWindow);

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('window-all-closed', () => {
  app.quit();
});
