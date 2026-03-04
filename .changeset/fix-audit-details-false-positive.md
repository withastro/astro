---
'astro': patch
---

Fixed false positive "Missing content" warnings in the dev toolbar audit for elements inside closed `<details>`. Uses `textContent` instead of `innerText` which is rendering-aware and returns empty for non-rendered elements.
