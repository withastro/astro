---
'astro': patch
---

Fixes the SSR manifest placeholder never being substituted when the server build is minified

The manifest and server-islands placeholders are replaced by a regex that runs on
already-generated chunk code, so it sees whatever quoting the minifier chose. Rolldown/oxc
normalises string literals to template literals, so a minified server build emitted the
placeholders backtick-quoted and the regexes — which matched only `'` and `"` — left them in
place.

For the manifest that produced a server bundle which built successfully (exit code 0) and
then threw `TypeError: Invalid URL string` at runtime, because `deserializeManifest` read
`rootDir`/`srcDir`/`outDir`/… off the literal placeholder string and passed `undefined` to
`new URL()`. On an edge adapter the result was a server entrypoint that could not boot at
all. The two server-islands placeholders shared the same pattern and the same latent
failure.
