import { defineConfig } from 'astro/config';
import testAdapter from '../../test-adapter.js';

export default defineConfig({
	output: 'server',
	adapter: testAdapter({
		extendAdapter: {
			contentCollectionSource: {
				entrypoint: new URL('./content-source.mjs', import.meta.url),
				config: { label: 'database' },
			},
		},
	}),
});
