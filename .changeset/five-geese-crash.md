---
'astro': major
---

Adjust default [View Transition](https://docs.astro.build/en/guides/view-transitions/) animations. Astro now sets opinionated defaults rather than relying on the browser's default User Agent styles.

Notably, Astro now disables the `root` animation rather than keeping the browser's default crossfade. The browser default behavior can still be used by setting the `transition:animate="initial"` directive on your `html` element.

Elements with a `transition:name` directive but no `transition:animate` directive will default to `crossfade`, a snappier version of the default User Agent animation.

Astro also supports a few new out-of-the-box `transition:animate` animations: `none` and `crossfade` join the existing `fade` and `slide` animations. `morph` has been renamed to `initial`.
