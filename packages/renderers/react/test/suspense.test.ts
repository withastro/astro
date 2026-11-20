import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { createServer } from 'vite';

// Suspense content must be rendered in place rather than in hidden segments revealed by
// inline scripts, which `security.csp` blocks. See https://github.com/withastro/astro/issues/18788
test('renders Suspense boundaries in place without inline reveal scripts', async () => {
	const server = await createServer({
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
	try {
		const { default: renderer } = await server.ssrLoadModule(
			new URL('../src/server.ts', import.meta.url).pathname,
		);
		const Lazy = React.lazy(async () => {
			await new Promise((resolve) => setTimeout(resolve, 20));
			return { default: () => React.createElement('p', { id: 'lazy' }, 'Loaded') };
		});
		const rows = Array.from({ length: 300 }, (_, index) =>
			React.createElement('li', { key: index }, `Row ${index} with some longer text`),
		);
		const Component = () =>
			React.createElement(
				'section',
				null,
				React.createElement(
					React.Suspense,
					{ fallback: React.createElement('p', null, 'Loading') },
					React.createElement(Lazy),
				),
				// Larger than React 19's default `progressiveChunkSize`, without suspending.
				React.createElement(
					React.Suspense,
					{ fallback: React.createElement('p', null, 'Loading list') },
					React.createElement('ul', null, rows),
				),
			);
		const { html } = await renderer.renderToStaticMarkup.call(undefined, Component, {}, {});
		assert.ok(html.includes('<p id="lazy">Loaded</p>'), html);
		assert.ok(html.includes('Row 299'), html);
		assert.ok(!html.includes('Loading'), html);
		assert.ok(!html.includes('<script'), html);
		assert.ok(!html.includes('hidden'), html);
	} finally {
		await server.close();
	}
});
