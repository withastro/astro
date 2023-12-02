---
'astro': minor
---

Greater consistency between navigations with and without `<ViewTransitions>`: Navigation to the current page starts view transition processing if the target URL is specified without a hash target. Navigation to different origin targets is excluded from view transition processing and is handled by the browser.
