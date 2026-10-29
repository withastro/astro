import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { renderToString } from '../dist/index.js';
import { setRenderConfig } from '../dist/render-setup.js';
import { createComponent, render } from '../dist/compiler/index.js';

const Hello = createComponent((result: { base: string }, props: Record<string, string>) => {
	return render`<p>Hello ${props.name} at ${result.base}</p>`;
});

describe('renderToString() from @astrojs/runtime', () => {
	it('throws RenderNotConfigured before astro() registers a render config', async () => {
		await assert.rejects(renderToString(Hello), { name: 'RenderNotConfigured' });
	});

	it('renders with the registered config, and a new registration replaces it', async () => {
		setRenderConfig({ base: '/a/' });
		const options = { props: { name: 'Node' }, partial: true };
		assert.equal(await renderToString(Hello, options), '<p>Hello Node at /a/</p>');
		setRenderConfig({ base: '/b/' });
		assert.equal(await renderToString(Hello, options), '<p>Hello Node at /b/</p>');
	});
});
