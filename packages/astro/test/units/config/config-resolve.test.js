import { expect } from 'chai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from '../../../dist/core/config/index.js';

describe('resolveConfig', () => {
	it('resolves relative inline root correctly', async () => {
		const { astroConfig } = await resolveConfig(
			{
				configFile: false,
				root: 'relative/path',
			},
			'dev'
		);
		const expectedRoot = path.join(process.cwd(), 'relative/path/');
		expect(fileURLToPath(astroConfig.root)).to.equal(expectedRoot);
	});
});
