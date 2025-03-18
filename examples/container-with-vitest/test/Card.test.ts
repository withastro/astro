import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { expect, test } from 'vitest';
import Card from '../src/components/Card.astro';
import CounterLight from '../src/components/CounterLight.astro';

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

test('Card with nested CounterLight', async () => {
	const container = await AstroContainer.create();
	const counterLight = await container.renderToString(CounterLight, { props: { count: 1 } });
	const result = await container.renderToString(Card, {
		slots: {
			default: counterLight,
		},
	});

	expect(result).toContain('This is a card');
	expect(result).toContain(counterLight);
});
