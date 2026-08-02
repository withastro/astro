---
'astro': patch
---

Fixes `popover` being rendered as `popover="true"`/`popover="false"` on custom elements (tag names containing a hyphen). Per the Popover API, the attribute only accepts `"auto"`, `"manual"`, or being absent, so boolean values are now always rendered as a bare `popover` attribute (or omitted), regardless of the tag name.
