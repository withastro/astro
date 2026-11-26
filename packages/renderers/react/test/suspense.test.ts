import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import React from 'react';
import { createServer, type ViteDevServer } from 'vite';

// Suspense content must be rendered in place rather than in hidden segments revealed by
// inline scripts, which `security.csp` blocks. See https://github.com/withastro/astro/issues/18788
describe('Suspense boundaries', () => {
	let server: ViteDevServer;
	let renderer: any;

	before(async () => {
		server = await createServer({
			configFile: false,
			server: { middlewareMode: true },
			plugins: [
				{
					name: 'react-renderer-options',
					resolveId(id) {
						if (id === 'astro:react:opts') return '\0react-options';
					},
					load(id) {
						if (id === '\0react-options') {
							return `export default ${JSON.stringify({ experimentalDisableStreaming: false })}`;
						}
					},
				},
			],
		});
		({ default: renderer } = await server.ssrLoadModule(
			new URL('../src/server.ts', import.meta.url).pathname,
		));
	});

	after(async () => {
		await server.close();
	});

	// React only outlines boundaries when the component renders content outside of them,
	// so each component below has a sibling before its boundary.
	function assertInPlace(html: string) {
		assert.ok(!html.includes('Loading'), html);
		assert.ok(!html.includes('<script'), html);
		assert.ok(!html.includes('hidden'), html);
	}

	it('renders suspended boundaries in place', async () => {
		const Lazy = React.lazy(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
			return { default: () => React.createElement('p', { id: 'lazy' }, 'Loaded') };
		});
		const Component = () =>
			React.createElement(
				'section',
				null,
				React.createElement('h2', null, 'Title'),
				React.createElement(
					React.Suspense,
					{ fallback: React.createElement('p', null, 'Loading') },
					React.createElement(Lazy),
				),
			);
		const { html } = await renderer.renderToStaticMarkup.call(undefined, Component, {}, {});
		assert.ok(html.includes('<p id="lazy">Loaded</p>'), html);
		assertInPlace(html);
	});

	it('renders boundaries larger than React 19 default progressiveChunkSize in place', async () => {
		// ~38 KB, well above React 19's default `progressiveChunkSize` (12,800 bytes).
		const rows = Array.from({ length: 1000 }, (_, index) =>
			React.createElement('li', { key: index }, `Row ${index} with some longer text`),
		);
		const Component = () =>
			React.createElement(
				'section',
				null,
				React.createElement('h2', null, 'Title'),
				React.createElement(
					React.Suspense,
					{ fallback: React.createElement('p', null, 'Loading list') },
					React.createElement('ul', null, rows),
				),
			);
		const { html } = await renderer.renderToStaticMarkup.call(undefined, Component, {}, {});
		assert.ok(html.includes('Row 999'), html);
		assertInPlace(html);
	});
});
