---
'astro': major
---

Astro's JSX handling has been refactored with better support for each framework.

Previously, Astro automatically scanned your components to determine which framework-specific transformations should be used. In practice, supporting advanced features like Fast Refresh with this approach proved difficult.

Now, rather than scanning your components, JSX framework integrations accept `include` and `exclude` config options. When using multiple JSX frameworks in the same project, users should manually control which files belong to each framework using the `include` and `exclude` options.

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
