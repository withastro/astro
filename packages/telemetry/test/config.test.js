import { expect } from 'chai';
import { GlobalConfig } from '../dist/config.js';

describe('GlobalConfig', () => {
	it('initializes when expected arguments are given', () => {
		const config = new GlobalConfig({ name: 'TEST_NAME' });
		expect(config).to.be.instanceOf(GlobalConfig);
	});
});
