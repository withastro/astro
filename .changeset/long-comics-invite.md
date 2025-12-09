---
'astro': patch
---

Gives a helpful error message if a user sets `output: "hybrid"` in their Astro config. 

The option was removed in Astro 5, but lots of content online still references it, and LLMs often suggest it. It's not always clear that the replacement is `output: "static"`, rather than `output: "server"`. This change adds a helpful error message to guide humans and robots.
