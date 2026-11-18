import * as assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	devServerCommand,
	isBackgroundServerProcess,
	previewServerCommand,
} from '../../../dist/cli/server.js';

describe('isBackgroundServerProcess', () => {
	for (const config of [devServerCommand, previewServerCommand]) {
		it(`returns true when ${config.envVar} is '1' (set by the background spawner)`, () => {
			assert.equal(isBackgroundServerProcess(config, { [config.envVar]: '1' }), true);
		});

		it(`returns false when ${config.envVar} is '0' (documented opt-out)`, () => {
			assert.equal(isBackgroundServerProcess(config, { [config.envVar]: '0' }), false);
		});

		it(`returns false when ${config.envVar} is unset`, () => {
			assert.equal(isBackgroundServerProcess(config, {}), false);
		});
	}
});
