---
'astro': patch
---

Fixes custom elements in MDX having their children's `slot` attribute stripped by the JSX runtime

When custom elements (tags with hyphens like `<my-element>`) are used in MDX files, the `slot` HTML attribute on their children is now correctly preserved. Previously, the shared JSX runtime would treat `slot` as an Astro slot assignment and remove it from the output, breaking Shadow DOM named slot distribution for web components.
