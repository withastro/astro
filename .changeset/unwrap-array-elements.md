---
"astro": patch
---

Fix `formDataToObject` to properly cast array elements to numbers and booleans when the element validator uses `.optional()`, `.nullable()`, or `.default()` modifiers.
