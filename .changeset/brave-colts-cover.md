---
"astro": minor
---

It's now possible the render components in isolation with the new Astro Container APIs:

If you use `vitest`, you can quickly write a test like this:

```js
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../src/components/Card.astro';

test('Card with slots', async () => {
	const container = await AstroContainer.create();
	const result = await container.renderToString(Card, {
		slots: {
			default: 'Card content',
		},
	});

	expect(result).toContain('This is a card');
	expect(result).toContain('Card content');
});
```
