---
'astro': patch
---

Fixes a bug where `<style>` tags from components such as a content collection's `Content` could be silently dropped from the output when an `await` appeared before the component in an `.astro` file's markup.
