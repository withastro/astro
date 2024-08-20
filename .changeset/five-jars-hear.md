---
'astro': patch
---

Removes the `experimental.directRenderScript` option and always render script directly. This new strategy prevents scripts from being executed in pages where they are not used. 

Scripts will directly render as declared in Astro files (including existing features like TypeScript, importing `node_modules`, and deduplicating scripts). You can also now conditionally render scripts in your Astro file.

However, this means scripts are no longer hoisted to the `<head>`, multiple scripts on a page are no longer bundled together, and the `<script>` tag may interfere with the CSS styling. Make sure to review your script tags and ensure that they behave as expected.
