import esbuild from 'esbuild';
import { expect } from 'chai';

describe('Bundle for browsers', async () => {
	it('esbuild browser build should work', async () => {
		const result = await esbuild.build({
			platform: 'browser',
			entryPoints: ['@astrojs/markdown-remark'],
			bundle: true,
			write: false,
		});
		// If some non-browser-safe stuff sneaks in, esbuild should error before reaching here
		expect(result.outputFiles.length).to.be.greaterThan(0);
	});
});
