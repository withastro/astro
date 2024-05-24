import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import ReactWrapper from '../src/components/ReactWrapper.astro';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/react';

const renderers = await loadRenderers([getContainerRenderer()]);
const container = await AstroContainer.create({
	renderers,
});

test('ReactWrapper with react renderer', async () => {
	const result = await container.renderToString(ReactWrapper);

	expect(result).toContain('Counter');
	expect(result).toContain('Count: <!-- -->5');
});
