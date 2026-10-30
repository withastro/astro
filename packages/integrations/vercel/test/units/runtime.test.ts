import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getRuntime } from '../../dist/index.js';

const logger = { warn() {} } as any;

describe('getRuntime', () => {
	it('uses the Bun runtime when built with Bun', () => {
		const proc = { version: 'v24.3.0', versions: { node: '24.3.0', bun: '1.3.9' } } as any;
		assert.equal(getRuntime(proc, logger), 'bun1.x');
	});

	it('uses the Node.js runtime when built with Node.js', () => {
		const proc = { version: 'v22.12.0', versions: { node: '22.12.0' } } as any;
		assert.equal(getRuntime(proc, logger), 'nodejs22.x');
	});

	for (const [version, runtime] of [
		['24.3.0', 'nodejs24.x'],
		['26.0.0', 'nodejs26.x'],
		['28.1.0', 'nodejs28.x'],
	]) {
		it(`uses ${runtime} without warning when built with Node.js ${version}`, () => {
			const warnings: string[] = [];
			const proc = { version: `v${version}`, versions: { node: version } } as any;
			assert.equal(getRuntime(proc, { warn: (m: string) => warnings.push(m) } as any), runtime);
			assert.deepEqual(warnings, []);
		});
	}

	for (const version of ['25.2.0', '27.0.0']) {
		it(`warns and falls back to nodejs24.x when built with odd Node.js ${version}`, () => {
			const warnings: string[] = [];
			const proc = { version: `v${version}`, versions: { node: version } } as any;
			assert.equal(
				getRuntime(proc, { warn: (m: string) => warnings.push(m) } as any),
				'nodejs24.x',
			);
			assert.equal(warnings.length, 1);
		});
	}
});
