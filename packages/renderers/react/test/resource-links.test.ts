import assert from 'node:assert/strict';
import { test } from 'node:test';
import React from 'react';
import { createServer } from 'vite';

// Test the renderer directly as well as the built-island fixture. In particular,
// a preload written by the component must not be confused with an automatic one.
for (const experimentalDisableStreaming of [false, true]) {
	test(`preserves resource links (streaming: ${!experimentalDisableStreaming})`, async () => {
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
							return `export default ${JSON.stringify({ experimentalDisableStreaming })}`;
						}
					},
				},
			],
		});
		try {
			const { default: renderer } = await server.ssrLoadModule(
				new URL('../src/server.ts', import.meta.url).pathname,
			);
			const links = [
				'stylesheet',
				'preconnect',
				'dns-prefetch',
				'preload',
				'modulepreload',
				'icon',
			];
			const Component = () =>
				React.createElement(
					'div',
					{ id: React.useId() },
					...links.map((rel) =>
						React.createElement('link', {
							key: rel,
							rel,
							href: `/authored-${rel}`,
							...(rel === 'preload' ? { as: 'image' } : {}),
						}),
					),
					// The explicit hint uses the same URL and attributes as React's auto hint.
					React.createElement('img', { src: '/authored-preload' }),
					React.createElement('img', { src: '/automatic.png' }),
					React.createElement('img', { src: '/responsive.png', srcSet: '/a.png 1x, /b.png 2x' }),
				);
			const context = { result: { request: new Request('https://example.com/') } };
			const { html, attrs } = await renderer.renderToStaticMarkup.call(context, Component, {}, {});
			assert.ok(
				/id="([^"]+)"/.exec(html)?.[1].includes(attrs.prefix),
				'useId must retain the island identifierPrefix',
			);
			for (const rel of links) {
				assert.ok(html.includes(`href="/authored-${rel}"`), `${rel} must survive: ${html}`);
			}
			assert.ok(html.includes('<img'));
			// Raw slot HTML must not be rewritten either.
			const slot = '<link rel="preload" as="font" href="/slot.woff2">';
			const slotResult = await renderer.renderToStaticMarkup.call(
				undefined,
				({ children }: { children?: React.ReactNode }) =>
					React.createElement('section', null, children),
				{},
				{ default: slot },
			);
			assert.ok(slotResult.html.includes(slot));
		} finally {
			await server.close();
		}
	});
}
