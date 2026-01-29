import { defineConfig, fontProviders } from 'astro/config';
import testAdapter from '../../test-adapter.js';

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: testAdapter(),
	site: 'https://foo.bar/',
	build: {
		assetsPrefix: 'https://cdn.example.com/'
	},
	experimental: {
		fonts: [
			{
				provider: fontProviders.google(),
				name: 'Roboto',
				cssVariable: '--font-test'
			}
		]
	}
});
