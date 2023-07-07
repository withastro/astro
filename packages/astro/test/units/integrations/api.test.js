import { expect } from 'chai';
import { runHookBuildSetup } from '../../../dist/integrations/index.js';

describe('Integration API', () => {
	it('runHookBuildSetup should work', async () => {
		const updatedViteConfig = await runHookBuildSetup({
			config: {
				integrations: [
					{
						name: 'test',
						hooks: {
							'astro:build:setup'({ updateConfig }) {
								updateConfig({
									define: {
										foo: 'bar',
									},
								});
							},
						},
					},
				],
			},
			vite: {},
			logging: {},
			pages: new Map(),
			target: 'server',
		});
		expect(updatedViteConfig).to.haveOwnProperty('define');
	});
});
