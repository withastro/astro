import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createBuilder, createServer, type ViteDevServer } from 'vite';

const root = fileURLToPath(new URL('./fixtures/standalone/', import.meta.url));

type RenderModule = { render(props: Record<string, any>): Promise<string> };

function getAttribute(html: string, name: string): string {
	const match = new RegExp(`${name}="([^"]+)"`).exec(html);
	assert.ok(match, `Expected a ${name} attribute in ${html}`);
	return match[1];
}

function getScriptSrc(html: string): string {
	const match = /<script type="module" src="([^"]+)"><\/script>/.exec(html);
	assert.ok(match, `Expected a module script in ${html}`);
	return match[1];
}

/** Polls `condition` until it holds, throwing after 5 seconds. */
async function waitFor(condition: () => boolean | Promise<boolean>, description: string) {
	const deadline = Date.now() + 5000;
	while (!(await condition())) {
		if (Date.now() > deadline) throw new Error(`Timed out waiting for ${description}`);
		await new Promise((resolve) => setTimeout(resolve, 50));
	}
}

type HmrPayload = { type: string; updates?: Array<{ path: string }> };

/** Records the HMR payloads that `server` sends to the browser until `stop()` is called. */
function recordHmrPayloads(server: ViteDevServer) {
	const payloads: HmrPayload[] = [];
	const client = server.environments.client.hot;
	const send = client.send;
	client.send = (payload: any, ...rest: any[]) => {
		payloads.push(payload);
		return (send as any).call(client, payload, ...rest);
	};
	return {
		payloads,
		stop() {
			client.send = send;
		},
	};
}

/**
 * Restores `file` and waits for its HMR update, so that it does not reach the next test. A missing
 * update is not an error: the file is unchanged when a test fails before editing it.
 */
async function restore(file: URL, original: string, hmr: ReturnType<typeof recordHmrPayloads>) {
	hmr.payloads.length = 0;
	await fs.writeFile(file, original);
	await waitFor(() => hmr.payloads.length > 0, 'the restored file').catch(() => {});
	hmr.stop();
}

describe('render API in dev', () => {
	let server: ViteDevServer;
	let origin: string;

	before(async () => {
		server = await createServer({ root, logLevel: 'silent', server: { port: 0 } });
		await server.listen();
		origin = server.resolvedUrls!.local[0].replace(/\/$/, '');
	});

	after(async () => {
		await server.close();
	});

	async function render() {
		const mod = (await server.ssrLoadModule('/src/render.js')) as RenderModule;
		return mod.render({ title: 'Hello' });
	}

	it('renders the component tree with its stylesheets inlined', async () => {
		const html = await render();
		assert.match(html, /^<!DOCTYPE html>/);
		assert.match(html, /<h1>Hello<\/h1>/);
		assert.match(html, /<head><title>Hello<\/title><style[^>]*>\.card\[data-astro-cid-\w+\]/);
		assert.match(html, /<style[^>]*>body \{ margin: 0; \}/);
	});

	it('adds the devHeadScript of renderers to the head, with the base', async () => {
		const html = await render();
		assert.match(
			html,
			/<script type="module">[^<]*from "\/@react-refresh"[^<]*<\/script>[\s\S]*<\/head>/,
		);
	});

	it('server-renders islands and points them at URLs the dev server serves', async () => {
		const html = await render();
		assert.match(html, /<astro-island[^>]*><button>count: <!-- -->2<\/button>/);
		const urls = [
			getAttribute(html, 'component-url'),
			getAttribute(html, 'renderer-url'),
			getScriptSrc(html),
		];
		assert.equal(urls[0], '/src/components/Counter.jsx');
		for (const url of urls) {
			const response = await fetch(origin + url);
			assert.equal(response.status, 200, url);
			assert.match(response.headers.get('content-type') ?? '', /javascript/, url);
		}
	});

	it('updates the styles of a component in the browser without a full reload', async () => {
		const file = new URL('./fixtures/standalone/src/components/Card.astro', import.meta.url);
		const original = await fs.readFile(file, 'utf-8');
		await render();
		await server.environments.client.transformRequest(
			'/src/components/Card.astro?astro&type=style&index=0&lang.css',
		);
		const hmr = recordHmrPayloads(server);
		try {
			await fs.writeFile(file, original.replace('rebeccapurple', 'tomato'));
			await waitFor(() => hmr.payloads.length > 0, 'an HMR payload');
			assert.deepEqual(
				hmr.payloads.map((payload) => payload.type),
				['update'],
			);
			assert.match(hmr.payloads[0].updates![0].path, /Card\.astro\?astro&type=style/);
			assert.match(await render(), /color: tomato/);
		} finally {
			await restore(file, original, hmr);
		}
	});

	it('reloads the page in the browser when the markup of a component changes', async () => {
		const file = new URL('./fixtures/standalone/src/components/Card.astro', import.meta.url);
		const original = await fs.readFile(file, 'utf-8');
		await render();
		const hmr = recordHmrPayloads(server);
		try {
			await fs.writeFile(
				file,
				original.replace('<section class="card">', '<section class="card edited">'),
			);
			await waitFor(
				() => hmr.payloads.some((payload) => payload.type === 'full-reload'),
				'a full-reload',
			);
			await waitFor(
				async () => (await render()).includes('class="card edited"'),
				'the edited markup',
			);
		} finally {
			await restore(file, original, hmr);
		}
	});

	it('collects stylesheets again after a file changes', async () => {
		const file = new URL('./fixtures/standalone/src/components/global.css', import.meta.url);
		const original = await fs.readFile(file, 'utf-8');
		try {
			await fs.writeFile(file, 'body { margin: 1px; }\n');
			let html = '';
			for (let attempt = 0; attempt < 50 && !html.includes('margin: 1px'); attempt++) {
				await new Promise((resolve) => setTimeout(resolve, 100));
				html = await render();
			}
			assert.match(html, /body \{ margin: 1px; \}/);
		} finally {
			await fs.writeFile(file, original);
		}
	});
});

describe('render API in a build', () => {
	let html: string;
	const clientDir = new URL('./fixtures/standalone/dist/client/', import.meta.url);

	before(async () => {
		await fs.rm(new URL('./fixtures/standalone/dist/', import.meta.url), {
			recursive: true,
			force: true,
		});
		const builder = await createBuilder({ root, logLevel: 'silent' });
		await builder.buildApp();
		const mod: RenderModule = await import(
			new URL('./fixtures/standalone/dist/server/render.js', import.meta.url).href
		);
		html = await mod.render({ title: 'Hello' });
	});

	it('links the stylesheets of the component tree, emitted to the client build', async () => {
		const hrefs = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
		assert.equal(hrefs.length, 2);
		const css = await Promise.all(
			hrefs.map((href) => fs.readFile(new URL(`.${href}`, clientDir), 'utf-8')),
		);
		assert.match(css.join('\n'), /\.card\[data-astro-cid-\w+\]\{color:#639\}/);
		assert.match(css.join('\n'), /body\{margin:0\}/);
	});

	it('points islands and scripts at client build chunks', async () => {
		assert.match(html, /<astro-island[^>]*><button>count: <!-- -->2<\/button>/);
		for (const url of [
			getAttribute(html, 'component-url'),
			getAttribute(html, 'renderer-url'),
			getScriptSrc(html),
		]) {
			assert.match(url, /^\/assets\/.+\.js$/);
			await fs.access(new URL(`.${url}`, clientDir));
		}
		const script = await fs.readFile(new URL(`.${getScriptSrc(html)}`, clientDir), 'utf-8');
		assert.match(script, /card script/);
	});

	it('leaves the devHeadScript of renderers out', () => {
		assert.equal(html.includes('@react-refresh'), false);
	});
});
