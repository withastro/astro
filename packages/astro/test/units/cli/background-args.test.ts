import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildBackgroundArgs } from '../../../dist/cli/server.js';
import type { Flags } from '../../../dist/cli/flags.js';

function makeFlags(overrides: Record<string, unknown> = {}): Flags {
	return { _: [], ...overrides };
}

describe('buildBackgroundArgs', () => {
	it('returns only the command when no flags are set', () => {
		assert.deepEqual(buildBackgroundArgs('dev', makeFlags()), ['dev']);
		assert.deepEqual(buildBackgroundArgs('preview', makeFlags()), ['preview']);
	});

	it('never includes --background', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ background: true }));
		assert.equal(args.includes('--background'), false);
	});

	it('forwards --port', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ port: 3000 }));
		assert.deepEqual(args, ['dev', '--port', '3000']);
	});

	it('forwards --host with a custom address', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ host: '0.0.0.0' }));
		assert.deepEqual(args, ['dev', '--host', '0.0.0.0']);
	});

	it('forwards bare --host', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ host: true }));
		assert.deepEqual(args, ['dev', '--host']);
	});

	it('forwards --config and --root', () => {
		const args = buildBackgroundArgs(
			'dev',
			makeFlags({ config: 'astro.custom.mjs', root: './site' }),
		);
		assert.deepEqual(args, ['dev', '--config', 'astro.custom.mjs', '--root', './site']);
	});

	it('forwards --allowed-hosts', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ allowedHosts: 'example.com,foo.dev' }));
		assert.deepEqual(args, ['dev', '--allowed-hosts', 'example.com,foo.dev']);
	});

	it('forwards --mode', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ mode: 'staging' }));
		assert.deepEqual(args, ['dev', '--mode', 'staging']);
	});

	it('forwards --site, --base and --outDir', () => {
		const args = buildBackgroundArgs(
			'dev',
			makeFlags({ site: 'https://example.com', base: '/docs', outDir: './build' }),
		);
		assert.deepEqual(args, [
			'dev',
			'--site',
			'https://example.com',
			'--base',
			'/docs',
			'--outDir',
			'./build',
		]);
	});

	it('forwards --verbose', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ verbose: true }));
		assert.deepEqual(args, ['dev', '--verbose']);
	});

	it('forwards --silent', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ silent: true }));
		assert.deepEqual(args, ['dev', '--silent']);
	});

	it('forwards --json', () => {
		const args = buildBackgroundArgs('dev', makeFlags({ json: true }));
		assert.deepEqual(args, ['dev', '--json']);
	});

	it('forwards the same flags for the preview command', () => {
		const args = buildBackgroundArgs(
			'preview',
			makeFlags({ mode: 'staging', outDir: './build', silent: true }),
		);
		assert.deepEqual(args, ['preview', '--mode', 'staging', '--outDir', './build', '--silent']);
	});
});
