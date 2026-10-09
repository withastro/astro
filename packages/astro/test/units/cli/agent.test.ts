import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { supportsAgentAutoBackgrounding } from '../../../dist/cli/agent.js';

describe('supportsAgentAutoBackgrounding', () => {
	it('disables agent-inferred backgrounding on Windows', () => {
		assert.equal(supportsAgentAutoBackgrounding('win32'), false);
	});

	it('supports agent-inferred backgrounding on other platforms', () => {
		assert.equal(supportsAgentAutoBackgrounding('darwin'), true);
		assert.equal(supportsAgentAutoBackgrounding('linux'), true);
	});
});
