---
'astro': patch
---

Fix inline `<style>` blocks being silently dropped when running `npm run dev` from a path whose casing differs from the canonical filesystem path on Windows and macOS.
