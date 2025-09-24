---
'@astrojs/svelte': minor
---

Adds support for async server rendering

Svelte 5.36 added experimental support for async rendering. This allows you to use `await` in your components in several new places. This worked out of the box with client-rendered components, but server-rendered components needed some extra help. This update adds support for async server rendering in Svelte components used in Astro.

To use async rendering, you must enable it in your Svelte config:

```js
// svelte.config.js
export default {
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};
```

Then you can use `await` in your components:

```svelte
<script>
  let data = await fetch('/api/data').then(res => res.json());
</script>
<h1>{data.title}</h1>
```

See [the Svelte docs](https://svelte.dev/docs/svelte/await-expressions) for more information on using `await` in Svelte components, including inside `$derived` blocks and directly in markup.
