---
'docs': patch
'astro': patch
---

# Hoisted scripts

This change adds support for hoisted scripts, allowing you to bundle scripts together for a page and hoist them to the top (in the head):

```astro
<script hoist>
  // Anything goes here!
</script>
```