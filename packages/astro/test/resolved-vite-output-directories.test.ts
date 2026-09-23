import assert from 'node:assert/strict';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import testAdapter from './test-adapter.ts';
import { loadFixture } from './test-utils.ts';

describe('Build: resolved Vite output directories', () => {
	it('uses resolved environment directories without mutating Astro config', async () => {
		const root = new URL('./fixtures/ssr-prerender/', import.meta.url);
		const configuredOutDir = new URL('dist/resolved-vite-output-input/', root);
		const resolvedRoot = new URL('dist/resolved-vite-output/', root);
		const outputDirectories = {
			client: new URL('client/', resolvedRoot),
			server: new URL('server/', resolvedRoot),
			prerender: new URL('prerender/', resolvedRoot),
		};
		let generatedDir: URL | undefined;
		let doneDir: URL | undefined;
		let manifest: { buildClientDir: string; buildServerDir: string } | undefined;

		const resolvedOutputPlugin: Plugin = {
			name: 'test:resolved-output-directories',
			enforce: 'post',
			configResolved(config) {
				const { client, ssr, prerender } = config.environments;
				if (!client || !ssr || !prerender) return;
				rmSync(resolvedRoot, { recursive: true, force: true });
				client.build.outDir = fileURLToPath(outputDirectories.client);
				ssr.build.outDir = fileURLToPath(outputDirectories.server);
				prerender.build.outDir = fileURLToPath(outputDirectories.prerender);
			},
		};

		const fixture = await loadFixture({
			root,
			output: 'server',
			outDir: fileURLToPath(configuredOutDir),
			build: { inlineStylesheets: 'never' },
			adapter: testAdapter({
				setManifest(value) {
					manifest = value as typeof manifest;
				},
			}),
			integrations: [
				{
					name: 'test:resolved-output-hooks',
					hooks: {
						'astro:build:generated': ({ dir }) => {
							generatedDir = dir;
						},
						'astro:build:done': ({ dir }) => {
							doneDir = dir;
						},
					},
				},
			],
			vite: { plugins: [resolvedOutputPlugin] },
		});

		await fixture.build();

		assert.equal(fixture.config.build.client.href, new URL('client/', configuredOutDir).href);
		assert.equal(fixture.config.build.server.href, new URL('server/', configuredOutDir).href);
		assert.equal(generatedDir?.href, outputDirectories.client.href);
		assert.equal(doneDir?.href, outputDirectories.client.href);
		assert.equal(manifest?.buildClientDir, outputDirectories.client.href);
		assert.equal(manifest?.buildServerDir, outputDirectories.server.href);
		assert.equal(existsSync(new URL('static/index.html', outputDirectories.client)), true);
		assert.equal(existsSync(new URL('entry.mjs', outputDirectories.server)), true);
		assert.equal(
			readdirSync(new URL('_astro/', outputDirectories.client)).some((file) =>
				file.endsWith('.css'),
			),
			true,
		);
		assert.equal(existsSync(new URL('.vite/', outputDirectories.server)), false);
		assert.equal(existsSync(new URL('.vite/', outputDirectories.prerender)), false);
	});
});
