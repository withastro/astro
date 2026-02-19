---
'astro': patch
---

Fixes `viewtransitions.css` being loaded on pages that use `server:defer` without any View Transition directives. The compiler incorrectly treats `server:defer` like a transition directive, causing the CSS to be imported. The CSS import is now stripped when no `transition:name`, `transition:animate`, or `transition:persist` directives are present in the source.
