---
'astro': patch
---

Restores environment variable precedence so values set in the real process (shell, CI) override `.env` file entries after the temporary Vite instance used to load `astro.config` applies env files to `process.env`
