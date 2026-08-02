---
'astro': patch
---

Fixes `astro dev` crashing with `Invalid URL` when `--host` is set to a specific non-loopback address

Vite only reports a `local` URL for loopback hosts. When the dev server was started with `--host <custom-address>` bound to a specific non-loopback address (a LAN or Tailscale IP, for example), the URL was reported under `network` and `local` was empty, so writing the dev lock file threw `Invalid URL` and killed a server that had already started successfully.

The lock file URL now falls back to the network URL, and a server that exposes no URL at all is left untracked rather than being taken down by lock file bookkeeping.
