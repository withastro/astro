import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import ReactWrapper from '../src/components/ReactWrapper.astro';

test('ReactWrapper with react renderer', async () => {
	const container = await AstroContainer.create({
		renderers: [
			{
				name: '@astrojs/react',
				clientEntrypoint: '@astrojs/react/client.js',
				serverEntrypoint: '@astrojs/react/server.js',
			},
		],
	});
	const result = await container.renderToString(ReactWrapper);

	expect(result).toContain('Counter');
	expect(result).toContain('Count: <!-- -->5');
});
