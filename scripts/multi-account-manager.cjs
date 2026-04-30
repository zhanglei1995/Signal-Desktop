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

function focusAccount(id) {
  const account = getAccount(id);

  if (process.platform === 'win32') {
    const command = [
      '$shell = New-Object -ComObject WScript.Shell',
      `$null = $shell.AppActivate(${quotePowerShellString(
        getExpectedWindowTitle(account)
      )})`,
      `$null = $shell.AppActivate(${quotePowerShellString('Signal')})`,
    ].join('; ');

    spawn(
      'powershell.exe',
      ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', command],
      {
        windowsHide: true,
        stdio: 'ignore',
      }
    );
  } else if (process.platform === 'darwin') {
    spawn('osascript', ['-e', 'tell application "Signal" to activate'], {
      stdio: 'ignore',
    });
  }

  return getSnapshot();
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
}

ipcMain.handle('manager:get-state', () => getSnapshot());
ipcMain.handle('manager:start', (_event, id) => startAccount(id));
ipcMain.handle('manager:stop', (_event, id) => stopAccount(id));
ipcMain.handle('manager:restart', (_event, id) => restartAccount(id));
ipcMain.handle('manager:focus', (_event, id) => focusAccount(id));
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
