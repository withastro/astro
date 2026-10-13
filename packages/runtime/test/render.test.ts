import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { transform } from '@astrojs/compiler-rs';
import { createRenderer } from '../dist/render.js';

// Components are compiled ahead of time and rendered in plain Node: no Vite and no virtual modules.
// The output directory is inside the package so `@astrojs/runtime/compiler-runtime`
// resolves through the package's self-reference.
const outDir = new URL('./fixtures/render-core-out/', import.meta.url);

const sources: Record<string, string> = {
	'Page.astro': `---
import Widget from './widget.js';
const { name } = Astro.props;
---
<html>
	<head><title>{name}</title></head>
	<body>
		<h1>Hello {name} from {Astro.site?.hostname}</h1>
		<slot />
		<Widget client:load count={2} />
	</body>
</html>`,
};

const widgetRenderer = {
	name: 'widget',
	clientEntrypoint: 'widget/client.js',
	ssr: {
		check: async () => true,
		renderToStaticMarkup: async (_Component: unknown, props: Record<string, any>) => ({
			html: `<b>${props.count}</b>`,
		}),
	},
};

describe('createRenderer() in plain Node', () => {
	let Page: any;

	before(async () => {
		await fs.mkdir(outDir, { recursive: true });
		await fs.writeFile(new URL('widget.js', outDir), 'export default function Widget() {}\n');
		for (const [file, source] of Object.entries(sources)) {
			const filename = fileURLToPath(new URL(file, outDir));
			const { code } = transform(source, {
				filename,
				internalURL: '@astrojs/runtime/compiler-runtime',
				resultScopedSlot: true,
				// Client specifiers reach `resolve()` as written in the component.
				resolvePath: (specifier) => specifier,
			});
			await fs.writeFile(`${filename}.mjs`, code);
		}
		Page = (await import(pathToFileURL(fileURLToPath(new URL('Page.astro.mjs', outDir))).href))
			.default;
	});

	after(async () => {
		await fs.rm(outDir, { recursive: true, force: true });
	});

	it('renders props, slots and Astro.site', async () => {
		const renderer = createRenderer({
			renderers: [widgetRenderer],
			site: 'https://example.com',
			resolve: async (specifier) => `/assets/${specifier.replace(/^\W+/, '')}`,
		});
		const html = await renderer.renderToString(Page, {
			props: { name: 'Node' },
			slots: { default: '<p>slotted</p>' },
		});
		assert.match(html, /^<!DOCTYPE html>/);
		assert.match(html, /<h1>Hello Node from example\.com<\/h1>/);
		assert.match(html, /<p>slotted<\/p>/);
	});

	it('renders framework islands with the given renderers and resolve()', async () => {
		const renderer = createRenderer({
			renderers: [widgetRenderer],
			resolve: async (specifier) => `/assets/${specifier.replace(/^\W+/, '')}`,
		});
		const html = await renderer.renderToString(Page, { props: { name: 'Node' } });
		assert.match(html, /<astro-island[^>]*component-url="\/assets\/widget\.js"/);
		assert.match(html, /<astro-island[^>]*renderer-url="\/assets\/widget\/client\.js"/);
		assert.match(
			html,
			/<astro-island[^>]*client="load"[^>]*><b>2<\/b><!--astro:end--><\/astro-island>/,
		);
		// The built-in `client:load` directive script is inlined.
		assert.match(html, /\(self\.Astro\|\|\(self\.Astro=\{\}\)\)\.load=/);
	});

	it('throws for client specifiers it cannot resolve', async () => {
		const renderer = createRenderer({ renderers: [widgetRenderer] });
		await assert.rejects(
			renderer.renderToString(Page, { props: { name: 'Node' } }),
			/Could not resolve "\.\/widget\.js"/,
		);
	});
});
