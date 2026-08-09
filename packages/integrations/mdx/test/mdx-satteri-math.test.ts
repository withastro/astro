import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('MDX Sätteri inline math with braces', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/mdx-satteri-math/', import.meta.url),
			integrations: [mdx()],
			markdown: {
				processor: satteri({ features: { math: true } }),
			},
		});
		await fixture.build();
	});

	it('compiles inline math containing non-JS brace groups', async () => {
		const html = await fixture.readFile('/inline-braces/index.html');
		const { document } = parseHTML(html);

		const mathSpans = document.querySelectorAll('code.math-inline');
		const values = Array.from(mathSpans).map((el) => el.textContent);

		assert.ok(values.includes('e^{-\\ln(2)/h}'), 'backslash-command in braces');
		assert.ok(values.includes('k^{*}'), 'star in braces');
		assert.ok(values.includes('w_i = 2^{-(\\tau_t - \\tau_i)/h}'), 'nested parens in braces');
		assert.ok(values.includes('x_{n-1}'), 'valid-JS braces still work');
	});

	it('leaves display math unaffected', async () => {
		const html = await fixture.readFile('/inline-braces/index.html');
		assert.ok(html.includes('e^{-\\ln(2)/h}'), 'display math braces are preserved');
	});
});
