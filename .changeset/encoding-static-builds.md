---
'astro': major
---

Routes with `%25` (percent-encoded percent sign) no longer supported

Routes containing `%25` in the filename are no longer supported in static builds. Pathnames are decoded during URL matching to prevent encoding-based security bypasses (e.g., bypassing route guards like `if(url.pathname === '/admin')`). When `%25` is decoded, it becomes `%`, which can lead to ambiguous or invalid encoding sequences and potential security issues. This restriction aligns with SSR mode, which cannot import modules with literal `%` characters in filenames. If you have routes with `%25` in the name, use a different character instead.
