---
'astro': major
---

Adds background dev server management for AI coding agents.

When an AI coding agent is detected, `astro dev` now automatically starts the dev server as a detached background process. This prevents the dev server from blocking the agent's terminal and allows it to continue working while the server runs.

A lock file (`.astro/dev.json`) is written when the dev server starts, recording the server's URL, port, and PID. This prevents duplicate servers from being started for the same project.

#### New flag and subcommands

- `astro dev --background` — Start the dev server as a background process (this is what runs automatically when an agent is detected).
- `astro dev stop` — Stop a running background dev server.
- `astro dev status` — Check if a dev server is running and display its URL, PID, and uptime.
- `astro dev logs` — View logs from a background dev server. Use `--follow` (`-f`) to stream new output as it's written.

These allow you to start and manage dev servers programmatically and were designed with AI coding agents in mind.

#### What should I do?

No action is required. If you are not using an AI coding agent, `astro dev` behaves exactly as before. If you are using an agent, background mode is enabled automatically — the agent will receive the server URL and PID, and can use `astro dev stop` to shut it down.

To opt out of automatic background mode when an agent is detected, set the environment variable `ASTRO_DEV_BACKGROUND=0` before running `astro dev`.
