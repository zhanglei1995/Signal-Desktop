# Signal Multi-Account Manager

This is a small development launcher for running multiple Signal Desktop profiles side by side. It gives a browser-like tab bar for starting, attaching, restarting, and stopping separate Signal instances.

The important isolation boundary is still one process and one `storageProfile` per account. The manager does not embed Signal in a `webview`.

## Start

```bash
pnpm run multi-account-manager
```

By default, the manager shows two accounts: `alice` and `bob`.

When you start an account, the manager creates a matching config file if needed:

```text
config/local-alice.json
config/local-bob.json
```

Each file points Signal at a separate data directory:

```json
{
  "storageProfile": "aliceProfile"
}
```

Signal then starts with:

```text
NODE_APP_INSTANCE=alice pnpm start
```

## Semi-Embedded Tabs

On Windows, the manager can create a semi-embedded tab effect:

- The tab bar and account controls stay in the manager window.
- Each account still runs as an independent Signal Desktop process.
- When you select a running tab, the manager moves that Signal window into the viewport area.
- Other running account windows are minimized until their tab is selected again.

This is window placement, not true DOM embedding. It keeps Signal's process and profile isolation intact while making the workflow feel closer to browser tabs.

## Configure Accounts

To customize the tabs, copy this file:

```text
scripts/multi-account-manager.config.example.json
```

to:

```text
config/multi-account-manager.json
```

Example:

```json
{
  "accounts": [
    {
      "id": "alice",
      "label": "Alice",
      "storageProfile": "aliceProfile"
    },
    {
      "id": "work",
      "label": "Work",
      "storageProfile": "workProfile"
    }
  ]
}
```

## Notes

- Use a different `id` and `storageProfile` for every account.
- Do not run two copies of the same profile at the same time.
- The manager attaches existing windows when possible. On Windows it targets the development window title, for example `Signal - development - alice`.
- The manager is for development use. It keeps Signal accounts isolated by process and data directory instead of turning the app into a multi-tenant single process.
