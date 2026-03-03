---
'astro': patch
---

Fixes i18n fallback middleware intercepting non-404 responses

The fallback middleware was triggering for all responses with status >= 300, including legitimate 3xx redirects, 403 forbidden, and 5xx server errors. This broke auth flows and form submissions on localized server routes. The fallback now correctly only triggers for 404 (page not found) responses.
