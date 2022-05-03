import { expect } from 'chai';
import * as events from '../dist/events/index.js';
import { resolveConfig } from '../../astro/dist/core/config.js';

async function mockConfig(userConfig) {
	return await resolveConfig(userConfig, import.meta.url, {}, 'dev');
}

describe('Session event', () => {
	it('top-level keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				css: { modules: [] },
				base: 'a',
				mode: 'b',
				define: {
					a: 'b',
				},
				publicDir: 'some/dir',
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'css',
			'css.modules',
			'base',
			'mode',
			'define',
			'publicDir',
		]);
	});

	it('vite.resolve keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				resolve: {
					alias: {
						a: 'b',
					},
					dedupe: ['one', 'two'],
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal(['resolve', 'resolve.alias', 'resolve.dedupe']);
	});

	it('vite.css keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				resolve: {
					dedupe: ['one', 'two'],
				},
				css: {
					modules: [],
					postcss: {},
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'resolve',
			'resolve.dedupe',
			'css',
			'css.modules',
			'css.postcss',
		]);
	});

	it('vite.server keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				server: {
					host: 'example.com',
					open: true,
					fs: {
						strict: true,
						allow: ['a', 'b'],
					},
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'server',
			'server.host',
			'server.open',
			'server.fs',
			'server.fs.strict',
			'server.fs.allow',
		]);
	});

	it('vite.build keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				build: {
					target: 'one',
					outDir: 'some/dir',
					cssTarget: {
						one: 'two',
					},
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'build',
			'build.target',
			'build.outDir',
			'build.cssTarget',
		]);
	});

	it('vite.preview keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				preview: {
					host: 'example.com',
					port: 8080,
					another: {
						a: 'b',
					},
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'preview',
			'preview.host',
			'preview.port',
			'preview.another',
		]);
	});

	it('vite.optimizeDeps keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				optimizeDeps: {
					entries: ['one', 'two'],
					exclude: ['secret', 'name'],
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal([
			'optimizeDeps',
			'optimizeDeps.entries',
			'optimizeDeps.exclude',
		]);
	});

	it('vite.ssr keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				ssr: {
					external: ['a'],
					target: { one: 'two' },
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal(['ssr', 'ssr.external', 'ssr.target']);
	});

	it('vite.worker keys are captured', async () => {
		const config = await mockConfig({
			vite: {
				worker: {
					format: { a: 'b' },
					plugins: ['a', 'b'],
				},
			},
		});

		const [{ payload }] = events.eventCliSession(
			{
				cliCommand: 'dev',
				astroVersion: '0.0.0',
			},
			config
		);
		expect(payload.config.viteKeys).is.deep.equal(['worker', 'worker.format', 'worker.plugins']);
	});
});
