import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { experimental_AstroContainer } from '../../../dist/container/index.js';

describe('Container deprecation warnings', () => {
	it('does not log markdown.gfm/smartypants deprecation warning with default config', async () => {
		const warn = mock.method(console, 'warn', () => {});
		try {
			await experimental_AstroContainer.create();

			const deprecationCalls = warn.mock.calls.filter((call) =>
				String(call.arguments[0]).includes('markdown.gfm'),
			);
			assert.equal(
				deprecationCalls.length,
				0,
				'Expected no deprecation warning for markdown.gfm/smartypants when using default config',
			);
		} finally {
			warn.mock.restore();
		}
	});
});
