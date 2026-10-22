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
});
