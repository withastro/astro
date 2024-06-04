---
"@astrojs/preact": minor
"@astrojs/svelte": minor
"@astrojs/react": minor
"@astrojs/solid-js": minor
"@astrojs/lit": minor
"@astrojs/mdx": minor
"@astrojs/vue": minor
"astro": patch
---

The integration now exposes a function called `getContainerRenderer`, that can be used inside the Container APIs to load the relative renderer.

```js
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ReactWrapper from '../src/components/ReactWrapper.astro';
import { loadRenderers } from "astro:container";
import { getContainerRenderer } from "@astrojs/react";

test('ReactWrapper with react renderer', async () => {
	const renderers = await loadRenderers([getContainerRenderer()])
	const container = await AstroContainer.create({
		renderers,
	});
	const result = await container.renderToString(ReactWrapper);

	expect(result).toContain('Counter');
	expect(result).toContain('Count: <!-- -->5');
});
```
