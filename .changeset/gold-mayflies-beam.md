---
"astro": patch
---

**BREAKING CHANGE** 

The **type** of the `renderers` option of the `AstroContainer::create` function has been changed. Now, in order to load the renderer, you can use a dedicated function:

```js
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import ReactWrapper from '../src/components/ReactWrapper.astro';
import { loadRenderers} from "astro:container";
import { getContainerRenderer } from "@astrojs/react";

test('ReactWrapper with react renderer', async () => {
	const renderers = await loadRenderers([getContainerRenderer(19)])
	const container = await AstroContainer.create({
		renderers,
	});
	const result = await container.renderToString(ReactWrapper);

	expect(result).toContain('Counter');
	expect(result).toContain('Count: <!-- -->5');
});
```

The `astro:container` is a virtual module that can be used when running the Astro container inside `vite`.
