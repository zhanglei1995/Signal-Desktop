// Copyright 2018 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import { ipcMain } from 'electron';
import type { WebContents } from 'electron';

import type { AccountRuntime } from './account_runtime.std.ts';

type SQLChannelEvent = Readonly<{ sender: WebContents }>;
type SQLChannelRuntime = Pick<
  AccountRuntime,
  'sql' | 'userConfig' | 'ephemeralConfig'
>;

let initialized = false;
let getRuntimeForEvent:
  | ((event: SQLChannelEvent) => SQLChannelRuntime)
  | undefined;

const SQL_READ_KEY = 'sql-channel:read';
const SQL_WRITE_KEY = 'sql-channel:write';
const SQL_REMOVE_DB_KEY = 'sql-channel:remove-db';
const ERASE_SQL_KEY = 'erase-sql-key';
const PAUSE_WRITE_ACCESS = 'pause-sql-writes';
const RESUME_WRITE_ACCESS = 'resume-sql-writes';

function getRuntime(event: SQLChannelEvent, key: string): SQLChannelRuntime {
  if (!getRuntimeForEvent) {
    throw new Error(`${key}: Not yet initialized!`);
  }

  return getRuntimeForEvent(event);
}

function wrapResult<Params extends Array<unknown>, T>(
  fn: (...params: Params) => Promise<T>
): (
  ...params: Params
) => Promise<{ ok: true; value: T } | { ok: false; error: Error }> {
  return async function wrappedIpcSqlMethod(...params) {
    try {
      return {
        ok: true,
        value: await fn(...params),
      };
    } catch (error) {
      return {
        ok: false,
        error,
      };
    }
  };
}

export function initialize({
  getRuntimeForEvent: nextGetRuntimeForEvent,
}: Readonly<{
  getRuntimeForEvent: (event: SQLChannelEvent) => SQLChannelRuntime;
}>): void {
  if (initialized) {
    throw new Error('sqlChannels: already initialized!');
  }
  initialized = true;

  getRuntimeForEvent = nextGetRuntimeForEvent;

  ipcMain.handle(
    SQL_READ_KEY,
    wrapResult(function ipcSqlReadHandler(event, callName, serialized) {
      return getRuntime(event, SQL_READ_KEY).sql.sqlReadSerialized(
        callName,
        serialized
      );
    })
  );

  ipcMain.handle(
    SQL_WRITE_KEY,
    wrapResult(function ipcSqlWriteHandler(event, callName, serialized) {
      return getRuntime(event, SQL_WRITE_KEY).sql.sqlWriteSerialized(
        callName,
        serialized
      );
    })
  );

  ipcMain.handle(SQL_REMOVE_DB_KEY, event => {
    return getRuntime(event, SQL_REMOVE_DB_KEY).sql.removeDB();
  });

  ipcMain.handle(ERASE_SQL_KEY, event => {
    const runtime = getRuntime(event, ERASE_SQL_KEY);
    runtime.userConfig.remove();
    runtime.ephemeralConfig.remove();
  });

  ipcMain.handle(PAUSE_WRITE_ACCESS, event => {
    return getRuntime(event, PAUSE_WRITE_ACCESS).sql.pauseWriteAccess();
  });

  ipcMain.handle(RESUME_WRITE_ACCESS, event => {
    return getRuntime(event, RESUME_WRITE_ACCESS).sql.resumeWriteAccess();
  });
}
