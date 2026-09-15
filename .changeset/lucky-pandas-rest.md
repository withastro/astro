---
'astro': patch
---

Fixes `experimental.incrementalBuild` restoring a page that links a stylesheet the new build no longer emits

A route's dependency hash was derived from its module graph, which cannot see everything that decides the CSS in the page's `<head>`. Sass and Less partials reached through `@use`/`@import` are inlined by the preprocessor and never become bundler modules, a function-valued `css.preprocessorOptions.*.additionalData` is dropped from the config hash, and a change in an unrelated page can regroup CSS chunks and rename a stylesheet this page shares. In each case the page was restored from the cache still pointing at an `/_astro/*.css` file that no longer existed, or carrying stale inline CSS.

The stylesheets a page resolves are now part of its dependency hash, and the styles a content entry propagates are part of that entry's render hash, so a page whose CSS changed is always re-rendered.
