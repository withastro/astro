---
"astro": minor
---

Introduces an experimental Container API to render `.astro` components in isolation.

This API introduces three new functions to allow you to create a new container and render an Astro component returning either a string or a Response:

- `create()`: creates a new instance of the container.
- `renderToString()`: renders a component and return a string.
- `renderToResponse()`: renders a component and returns the `Response` emitted by the rendering phase.

The first supported use of this new API is to enable unit testing. For example, with  `vitest`, you can create a container to render your component with test data and check the result:

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

For a complete reference, see the [Container API docs](/en/reference/container-reference/).

For a feature overview, and to give feedback on this experimental API, see the [Container API roadmap discussion](https://github.com/withastro/roadmap/pull/916).
