---
'astro': minor
---

Adds the `astro preview --background` flag to start preview servers as background processes.

This makes preview servers easier to manage from scripts and AI coding agents because the command returns after the server is ready instead of keeping the terminal attached to the long-running process.

```sh
astro preview --background
```

When a preview server is running in the background, you can inspect or stop it with new `astro preview` subcommands:

```sh
astro preview status
astro preview logs
astro preview logs --follow
astro preview stop
```

If Astro detects that `astro preview` is being run by an AI coding agent, background mode is enabled automatically. This matches the existing behavior for `astro dev`, allowing agents to continue working after the preview server starts while still receiving the server URL and process ID.

To opt out of automatic background mode for preview servers, set `ASTRO_PREVIEW_BACKGROUND=0` before running `astro preview`.
