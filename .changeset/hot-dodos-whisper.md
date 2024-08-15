---
'astro': patch
---

Prevent errant HTML from crashing server islands

When an HTML minifier strips away the server island comment, the script can't correctly know where the end of the fallback content is. This makes it so that it simply doesn't remove any DOM in that scenario. This means the fallback isn't removed, but it also doesn't crash the browser.
