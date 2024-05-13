import { unstable_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import * as Card from '../src/pages/[locale].astro';

test('Dynamic route', async () => {
	const container = await AstroContainer.create();
	const result = await container.renderToString(Card, {
		params: ['locale'],
		request: new Request('http://example.com/en'),
		route: '/[locale]',
	});

	expect(result).toContain('Locale: en');
});
