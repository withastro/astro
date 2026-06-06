---
'@astrojs/react': patch
---

Fixes user-authored `<link rel="stylesheet">` elements being stripped from React components rendered by Astro. The regex that removes React 19's auto-injected resource hints incorrectly matched `rel="stylesheet"`, silently dropping stylesheet links from island output in both `dev` and `build`. React 19 only auto-injects `<link rel="preload">`, so `stylesheet` has been removed from the match list.
