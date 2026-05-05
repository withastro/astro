# Bug: Background dev server infinite recursion when spawned by AI agent

## Summary

When `astro dev` is run inside an AI coding agent (e.g. OpenCode, Claude Code), the background dev server feature enters an infinite spawn loop and times out after 30 seconds without ever starting a server. The user sees:

```json
{"error":"timeout","message":"Dev server failed to start within 30s."}
```

## Root Cause

The `dev` command in `packages/astro/src/cli/dev/index.ts` uses `am-i-vibing`'s `isAgent()` to detect AI agent environments and automatically enter background mode. When background mode is triggered, `background.ts` spawns a **child process** running `astro dev` (without `--experimental-background`) and polls for a lockfile indicating the server is ready.

The problem is that the child process is spawned with `{ ...process.env }`, which **inherits the agent environment variables** (e.g. `OPENCODE=1`). When the child runs `astro dev`, it also calls `isAgent()`, gets `true`, and enters background mode again -- spawning yet another child. This creates an infinite recursion:

```
astro dev (PID 1)
  → isAgent() = true (OPENCODE=1 in env)
  → enters background(), spawns child with { ...process.env }
    → astro dev (PID 2)
      → isAgent() = true (OPENCODE=1 still in env)
      → enters background(), spawns child with { ...process.env }
        → astro dev (PID 3)
          → isAgent() = true ...
          → ... and so on until 30s timeout
```

No process ever reaches the foreground dev server code path, so no lockfile is written, and the parent times out.

### Affected environment variables

The `am-i-vibing` library checks for these env vars (among others) to detect agents:

- **OpenCode**: `OPENCODE`, `OPENCODE_BIN_PATH`, `OPENCODE_SERVER`, `OPENCODE_APP_INFO`, `OPENCODE_MODES`
- **Claude Code**: `CLAUDECODE`
- **Cursor Agent**: `CURSOR_TRACE_ID` + `PAGER=head -n 10000 | cat`
- **Replit**: `REPL_ID`
- **Windsurf**: `CODEIUM_EDITOR_APP_ROOT`

Any of these being present in the parent environment will trigger the recursion.

## Reproduction

1. Set `OPENCODE=1` in the environment (or run from within any detected AI agent)
2. Run `astro dev` in a project using the preview build from PR #16610
3. Observe: the command hangs for 30 seconds, then outputs the timeout error

## Fix

Two changes, both in `packages/astro/src/cli/dev/`:

### 1. `background.ts` -- Set a guard env var on the spawned child

```diff
 const child = spawn(astroBin, args, {
   detached: true,
   stdio: ['ignore', logFd, logFd],
   cwd: rootPath,
-  env: { ...process.env },
+  env: { ...process.env, ASTRO_DEV_BACKGROUND: '1' },
 });
```

### 2. `index.ts` -- Check for the guard before entering background mode

```diff
- if (flags.experimentalBackground || isRunByAgent()) {
+ if (flags.experimentalBackground || (isRunByAgent() && !process.env.ASTRO_DEV_BACKGROUND)) {
```

The `ASTRO_DEV_BACKGROUND` env var acts as a recursion guard. The parent sets it when spawning the child, and the child checks for it before deciding whether to enter background mode. This way the child always takes the foreground code path and actually starts the dev server.

This approach is preferable to stripping specific agent env vars because:
- It doesn't need to track which env vars `am-i-vibing` checks
- It's forward-compatible with new agent detections added to `am-i-vibing`
- It's explicit about intent: "I am the background-spawned child, run in foreground"
