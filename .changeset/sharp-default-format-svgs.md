---
'astro': patch
---

Fixes remote SVG sources erroring with `dangerouslyProcessSVG` after the v6.3 SVG-processing gate. The default Sharp service now resolves the output format from the source up-front when it can (URL extension, `data:` MIME, ESM metadata), and from the actual buffer at request time when it can't, so SVG sources pass through untouched without needing to set `image.dangerouslyProcessSVG: true` or an explicit `format="svg"`.

The error message has also been updated to point at `format="svg"` as the simpler workaround when an SVG source is encountered without `dangerouslyProcessSVG` enabled.
