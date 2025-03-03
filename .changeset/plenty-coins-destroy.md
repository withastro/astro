---
'@astrojs/partytown': patch
---

Adds support for `config.lib`, which allows changing the destination of the files:

```diff
export default defineConfig({
	integrations: [partytown({
		config: {
+			lib: '/assets/lib/~partytown/';
		}
	})]
})
```