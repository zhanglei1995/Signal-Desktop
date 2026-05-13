# Multi-Account Hot Switch Plan

## Goal

Build true in-page account switching for Signal Desktop.

The current first version keeps one BrowserWindow, switches its `AccountRuntime`,
and reloads the page. That gives the right user shape, but it is not a true hot
switch. A true hot switch should change accounts inside the same running
renderer without a full page reload.

## Current State

- `AccountRuntime` exists in the main process and tracks:
  - runtime id
  - label
  - app instance
  - storage profile
  - user data path
  - user config
  - ephemeral config
  - SQL instance
  - attached window
- SQL IPC is routed by `WebContents` to the active runtime.
- Attachment IPC and `attachment://` URLs are runtime-aware through
  `accountRuntimeId`.
- Renderer config includes `accountRuntimeId`.
- The app shell exposes an account switcher in the page.
- Switching accounts currently reloads the same BrowserWindow.

## Target Behavior

- One app window.
- Account switcher is always visible in the app shell.
- Switching accounts does not create a second Signal window.
- Switching accounts does not require a full app restart.
- Eventually, switching accounts should not reload the page.
- Each account keeps isolated:
  - database
  - attachment directories
  - drafts
  - temp files
  - config
  - ephemeral settings
  - websocket/session state
  - notification state
  - Redux-visible user/conversation state

## Architecture Direction

Use one `BrowserWindow` and multiple `AccountRuntime` objects.

The main process owns all account runtimes. The renderer owns only the active
account view state. A switch request should move the renderer from one runtime
to another through a controlled lifecycle:

1. Pause active account services.
2. Flush pending writes and UI work.
3. Detach active renderer bindings from the old runtime.
4. Bind renderer IPC and services to the next runtime.
5. Hydrate renderer state for the next runtime.
6. Resume account services.
7. Update account switcher active state.

## Phase 1: Stabilize Current Reload Switch

Purpose: make the current single-window reload switch safe enough to use while
building true hot switching.

Tasks:

- Rename `SIGNAL_MULTI_ACCOUNT_WINDOWS` or add a clearer alias such as
  `SIGNAL_MULTI_ACCOUNT_IDS`.
- Keep old env compatibility for now.
- Ensure account labels can come from config, not only raw ids.
- Remove remaining multi-window assumptions from naming and comments.
- Show switching/loading feedback in the account switcher.
- Handle failed switch with a visible error state.
- Decide whether primary account id should display as `primary`, app name, or
  profile label.
- Add focused tests for:
  - account runtime registration
  - SQL IPC routing by sender
  - attachment URL runtime parameter
  - account switch IPC selecting the target runtime

Acceptance:

- `pnpm exec tsgo --noEmit` passes.
- `pnpm run generate` succeeds.
- Launching with two account ids shows one window with a visible account switcher.
- Switching account reloads the same window and shows the selected account data.

## Phase 2: Runtime-Aware Main Process Services

Purpose: remove hidden global state that would make hot switching unsafe.

Audit and convert services that currently assume one global account:

- SQL access
- attachment cleanup and attachment protocol
- settings channel
- notification service
- system tray unread count
- badge count
- power events
- call state
- challenge handling
- protocol link handling
- debug log metadata
- storage service
- websocket/socket manager ownership
- backup/import/export services
- profile write/read services

Tasks:

- Create a service ownership table:
  - global service
  - per-account service
  - active-account-only service
- For per-account services, store them on or behind `AccountRuntime`.
- For active-account-only services, add `activate(runtime)` and
  `deactivate(runtime)` lifecycle methods.
- Make logging include account runtime id where useful.
- Make notification/tray behavior explicitly aggregate or active-account-only.

Acceptance:

- No account data service reads `app.getPath('userData')` directly when it should
  use runtime `userDataPath`.
- No SQL operation can accidentally hit the primary runtime when invoked by a
  secondary account view.
- Closing or switching accounts does not leave stale per-account timers running.

## Phase 3: Renderer Lifecycle Boundary

Purpose: define what must be torn down and recreated when the active account
changes without reloading the page.

Tasks:

- Introduce an account session boundary in renderer startup.
- Separate global renderer boot from account renderer boot.
- Identify account-bound globals:
  - `window.ConversationController`
  - `window.reduxStore`
  - `window.reduxActions`
  - `window.MessageCache`
  - `itemStorage`
  - websocket resources
  - notification profile service
  - expiring message timers
  - tap-to-view deletion service
  - storage sync tasks
- Add a controlled `stopAccountSession()` function.
- Add a controlled `startAccountSession(accountRuntimeId)` function.
- Make startup code callable for a new account without reloading `background.html`.
- Ensure event listeners registered during account startup can be removed.

Acceptance:

- A dev-only command can stop and restart the same account session without page
  reload.
- Event listeners do not duplicate after repeated stop/start cycles.
- Redux state resets when starting another account.

## Phase 4: Hot Switch IPC Contract

Purpose: replace reload-based switching with explicit lifecycle events.

Proposed IPC:

- `accounts:get-runtimes`
- `accounts:prepare-switch`
- `accounts:activate-runtime`
- `accounts:switch-complete`
- `accounts:switch-failed`

Renderer flow:

1. User selects account.
2. Renderer disables account switcher.
3. Renderer calls `accounts:prepare-switch`.
4. Renderer stops current account session.
5. Renderer calls `accounts:activate-runtime`.
6. Renderer starts next account session.
7. Renderer calls `accounts:switch-complete`.
8. Renderer re-enables account switcher.

Main process flow:

1. Validate target runtime.
2. Initialize runtime SQL if needed.
3. Pause old active runtime services.
4. Mark window sender as target runtime.
5. Resume target runtime services.
6. Return fresh config/session payload.

Acceptance:

- Account switch does not call `window.location.reload`.
- `get-config` is no longer the only way to obtain active account config.
- The account switcher stays mounted through a switch.

## Phase 5: UX Polish

Purpose: make switching feel native and predictable.

Tasks:

- Move switcher to the final product location.
- Show account avatar/name/phone or profile label when available.
- Add loading state during switch.
- Add failed switch recovery.
- Preserve per-account selected conversation where possible.
- Preserve per-account draft text only inside that account.
- Add keyboard shortcuts for account switching.
- Decide notification behavior for inactive accounts.

Acceptance:

- Switching accounts has clear visual feedback.
- The user cannot send from the wrong account during a switch.
- Inactive account notifications are understandable.

## Phase 6: Test Matrix

Core tests:

- Switch from unregistered account to registered account.
- Switch from registered account to unregistered account.
- Switch while linked but websocket disconnected.
- Switch while installer is open.
- Switch while a conversation is selected.
- Switch while composing a draft.
- Switch while media upload/download is in progress.
- Switch while a call is active or ringing.
- Switch repeatedly between three accounts.
- Switch after one account database fails to initialize.

Manual smoke tests:

- Start with `alice,bob`.
- Link Alice.
- Link Bob.
- Send message from Alice.
- Switch to Bob and verify Alice data is absent.
- Send message from Bob.
- Switch back to Alice and verify Alice data returns.
- Verify attachment previews load from the right account directory.
- Verify tray/unread state behaves as designed.

## Risks

- Renderer globals are deeply account-bound today.
- Some services may silently capture SQL or storage helpers at module load time.
- WebSocket and storage sync lifecycle may not tolerate repeated teardown.
- Notifications and tray counts need a product decision: aggregate or active only.
- Calls may need a hard guard: block account switching during active calls.
- Full hot switching may expose hidden singleton assumptions in tests.

## Recommended Next Step

Finish Phase 1 first. It gives a stable single-window switching baseline that is
easy to test and demo. Then audit services for Phase 2 before attempting true
no-reload hot switching.
