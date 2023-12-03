---
'astro': minor
---

Greater consistency between navigations with and without `<ViewTransitions>`: 

- New for direct calls to `navigate()`: Navigation to a URL whose origin does not match the origin of the current page is excluded from view transition processing and triggers the standard navigation of the browser.
- New: Navigation to the current page (= same path name and same search parameters) without a hash fragment triggers view transition processing.
- New for form submission: Navigation to a non-empty hash target on the current page does not trigger view transitions, but updates the browser history directly and scrolls to the target position. 

