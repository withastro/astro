---
"@astrojs/vercel": patch
---

Better ignores for Vercel file-tracer

The Vercel adapter has a file-tracer it uses to detect which files should be moved over to the dist folder. When its done it prints warnings for things that it detected that maybe should be moved.

This change expands how we do ignores so that:

- Ignores happen within dot folders like `.pnpm`.
- `@libsql/client` is ignored, a package we know is not bundled.
