import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isBackgroundEnvEnabled, supportsAgentAutoBackgrounding } from '../../../dist/cli/agent.js';

describe('supportsAgentAutoBackgrounding', () => {
	it('disables agent-inferred backgrounding on Windows', () => {
		assert.equal(supportsAgentAutoBackgrounding('win32'), false);
	});

	it('supports agent-inferred backgrounding on other platforms', () => {
		assert.equal(supportsAgentAutoBackgrounding('darwin'), true);
		assert.equal(supportsAgentAutoBackgrounding('linux'), true);
	});
});

describe('isBackgroundEnvEnabled', () => {
	it('is true for the value set on spawned background servers', () => {
		assert.equal(isBackgroundEnvEnabled('1'), true);
		assert.equal(isBackgroundEnvEnabled('true'), true);
	});

	it('is false for the documented opt-out and other falsy values', () => {
		assert.equal(isBackgroundEnvEnabled('0'), false);
		assert.equal(isBackgroundEnvEnabled('false'), false);
		assert.equal(isBackgroundEnvEnabled('FALSE'), false);
		assert.equal(isBackgroundEnvEnabled(''), false);
		assert.equal(isBackgroundEnvEnabled(undefined), false);
	});
});
