import assert from 'node:assert/strict';
import { rm, writeFile } from 'node:fs/promises';
import { after, afterEach, before, describe, it } from 'node:test';
import { setTimeout } from 'node:timers/promises';
import type { Plugin } from 'vite';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// Remote cache clears must not replace unchanged React instances inside a render.
// Keep the request suspended until the edit is processed and fresh requests see it.
describe('Cloudflare dev HMR', { timeout: 120_000 }, () => {
	let fixture: Fixture;
	let server: DevServer;
	let browserReloads = 0;
	let runnerReloads = 0;
	const gates = new Map<string, ReturnType<typeof createGate>>();

	function createGate() {
		return { entered: Promise.withResolvers<void>(), release: Promise.withResolvers<void>() };
	}

	async function waitFor<T>(read: () => Promise<T>, matches: (value: T) => boolean): Promise<T> {
		let last: T;
		for (let attempt = 0; attempt < 200; attempt++) {
			last = await read();
			if (matches(last)) return last;
			await setTimeout(25);
		}
		assert.fail(`HMR did not settle: ${String(last!)}`);
	}

	async function html(path = '/hmr') {
		const response = await fixture.fetch(path);
		const body = await response.text();
		assert.equal(response.status, 200, body);
		return body;
	}

	const observeReloads: Plugin = {
		name: 'test:hmr-request-gates',
		configureServer(vite) {
			const browserSend = vite.ws.send.bind(vite.ws);
			vite.ws.send = (...args: unknown[]) => {
				const payload = args[0];
				if (
					payload &&
					typeof payload === 'object' &&
					'type' in payload &&
					payload.type === 'full-reload'
				)
					browserReloads++;
				return Reflect.apply(browserSend, undefined, args);
			};
			const environment = vite.environments.ssr;
			const runnerSend = environment.hot.send.bind(environment.hot);
			environment.hot.send = (...args: unknown[]) => {
				const payload = args[0];
				if (
					payload &&
					typeof payload === 'object' &&
					'type' in payload &&
					payload.type === 'full-reload'
				)
					runnerReloads++;
				return Reflect.apply(runnerSend, undefined, args);
			};
			vite.middlewares.use((request, response, next) => {
				const id = request.url?.match(/^\/__hmr-gate\/([\w-]+)/)?.[1];
				if (!id) return next();
				const gate = gates.get(id);
				if (!gate) {
					response.statusCode = 404;
					return response.end();
				}
				gate.entered.resolve();
				gate.release.promise.then(() => response.end('released'));
			});
		},
	};

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/dev-hmr/',
			devToolbar: { enabled: false },
			vite: { plugins: [observeReloads] },
		});
		server = await fixture.startDevServer();
		await waitFor(
			() => html(),
			(body) => body.includes('id="hook-count">0'),
		);
		await html();
	});

	afterEach(() => {
		for (const gate of gates.values()) gate.release.resolve();
		gates.clear();
		fixture?.resetAllFiles();
	});

	after(async () => {
		for (const gate of gates.values()) gate.release.resolve();
		await server?.stop();
	});

	it('preserves React during an SSR edit and refreshes transitive and dynamic imports', async () => {
		for (const value of [1, 2, 3]) {
			const id = `render-${value}`;
			const gate = createGate();
			gates.set(id, gate);
			const pending = fixture.fetch(`/hmr?gate=${id}`);
			await gate.entered.promise;
			const previousBrowserReloads = browserReloads;
			const previousRunnerReloads = runnerReloads;
			try {
				await fixture.editFile('./src/hmr/value.js', `export const value = ${value};\n`);
				await waitFor(
					async () => browserReloads,
					(count) => count > previousBrowserReloads,
				);
				const fresh = await waitFor(
					() => html(),
					(body) =>
						body.includes(`id="value">${value}`) && body.includes(`id="lazy-value">${value}`),
				);
				assert.match(fresh, /id="react-identity">same/);
				gate.release.resolve();
				const response = await pending;
				const body = await response.text();
				assert.equal(response.status, 200, body);
				assert.match(body, /id="react-identity">same/);
				assert.match(body, /id="hook-count">0/);
				assert.equal(
					runnerReloads,
					previousRunnerReloads,
					'must not reset unrelated runner modules',
				);
			} finally {
				gate.release.resolve();
				const response = await pending;
				if (!response.bodyUsed) await response.body?.cancel();
			}
		}
	});

	it('refreshes a changed barrel export without resetting unrelated dependencies', async () => {
		await html();
		await fixture.editFile('./src/hmr/index.js', "export { value } from './alternate.js';\n");
		const body = await waitFor(
			() => html(),
			(body) => body.includes('id="value">20'),
		);
		assert.match(body, /id="hook-count">0/);
		assert.match(body, /id="react-identity">same/);
	});

	it('preserves module identity while a response body is streaming', async () => {
		const gate = createGate();
		gates.set('stream', gate);
		const response = await fixture.fetch('/hmr-stream?gate=stream');
		assert.equal(response.status, 200);
		const reader = response.body!.getReader();
		assert.equal(new TextDecoder().decode((await reader.read()).value), 'prefix\n');
		await gate.entered.promise;
		try {
			await fixture.editFile('./src/hmr/value.js', 'export const value = 4;\n');
			await waitFor(
				() => html(),
				(body) => body.includes('id="lazy-value">4'),
			);
			gate.release.resolve();
			let tail = '';
			for (;;) {
				const { done, value } = await reader.read();
				if (done) break;
				tail += new TextDecoder().decode(value);
			}
			assert.equal(JSON.parse(tail).same, true);
		} finally {
			gate.release.resolve();
			await reader.cancel();
		}
	});

	it('refreshes an edited Astro page', async () => {
		await fixture.editFile('./src/pages/hmr.astro', (source) =>
			source.replace('Original page', 'Edited page'),
		);
		assert.match(
			await waitFor(
				() => html(),
				(body) => body.includes('Edited page'),
			),
			/id="hook-count">0/,
		);
	});

	it('refreshes dev CSS after an edit', async () => {
		await fixture.editFile('./src/hmr/style.css', (source) => source.replace('red', 'blue'));
		assert.match(
			await waitFor(
				() => html(),
				(body) => body.includes('--hmr-color: blue'),
			),
			/id="hook-count">0/,
		);
	});

	it('detects added and removed routes', async () => {
		const file = new URL('./src/pages/hmr-added.astro', fixture.config.root);
		try {
			await writeFile(file, '<h1>Added HMR route</h1>');
			await waitFor(
				async () => {
					const response = await fixture.fetch('/hmr-added');
					return { status: response.status, body: await response.text() };
				},
				(response) => response.status === 200 && response.body.includes('Added HMR route'),
			);
			await rm(file);
			await waitFor(
				async () => {
					const response = await fixture.fetch('/hmr-added');
					await response.arrayBuffer();
					return response.status;
				},
				(status) => status === 404,
			);
		} finally {
			await rm(file, { force: true });
		}
	});
});
