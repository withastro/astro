---
'astro': patch
---

Improve granularity of production build logs. This now lists:
- the "data collection" build step, with timeout warnings for larger imports. This is useful for understanding large `import.meta.glob` calls.
- the Vite client bundling step. This logs all Vite production build info to clarify what assets are built alongside your HTML.
- the route generation step, complete with all output HTML files for a given input file. This is especially useful when debugging `getStaticPaths`.
- fixes "0 pages in Infinityms" log when building to SSR