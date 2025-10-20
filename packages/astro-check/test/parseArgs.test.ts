import { expect } from 'chai';
import { describe, it } from 'mocha';
import { parseArgsAsCheckConfig } from '../dist/index.js';

describe('astro-check - Arguments parser', async () => {
	it('Can parse an empty array', async () => {
		const result = parseArgsAsCheckConfig([]);

		expect(result).to.deep.contain({
			watch: false,
			tsconfig: undefined,
			minimumSeverity: 'hint',
			preserveWatchOutput: false,
		});
	});

	it('Can parse boolean', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--watch', '--preserveWatchOutput']);
		expect(result.watch).to.equal(true);
		expect(result.preserveWatchOutput).to.equal(true);
	});

	it('Can parse string', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--root', 'foo']);
		expect(result.root).to.equal('foo');
	});

	it('Can parse string with choice', async () => {
		const result = parseArgsAsCheckConfig(['', '', '--minimumSeverity', 'error']);
		expect(result.minimumSeverity).to.equal('error');
	});
});
