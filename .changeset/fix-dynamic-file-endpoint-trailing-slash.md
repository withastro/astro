---
"astro": patch
---

Fix dynamic file endpoints ignoring `trailingSlash: "never"` in dev

Routes like `/api/[name].json.ts` incorrectly inherited the global `trailingSlash` config in dev, causing a dev/build behavior mismatch: `GET /api/bar.json` returned 404 while `GET /api/bar.json/` returned 200 when `trailingSlash: "always"` was set.

The root cause was `trailingSlashForPath` checking `pathname && hasFileExtension(pathname)`. For any dynamic route, `pathname` is `null`, so the guard always short-circuited before reaching `hasFileExtension`. The fix falls back to the segment-joined route string, which preserves file extensions even for dynamic segments (e.g. `/api/[name].json`).
