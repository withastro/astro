---
'astro': major
---

JSX refactor

JSX in Astro has been refactored to better support each framework. In order to support multiple JSX frameworks at the same time, new `include` and `exclude` config options have been added to each integration to control which files to target. For example:

```js
export default defineConfig({
  integrations: [
		preact({
			include: ['**/preact/*']
		}),
		react({
			include: ['**/react/*']
		}),
		solid({
			include: ['**/solid/*'],
		}),
  ]
});
```

This config is only needed in projects that use multiple JSX frameworks; if only using one no config is needed.
