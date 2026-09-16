import { createContentCollectionStorage } from '@astrojs/content-source-sqlite';
import { defineConfig } from 'astro/config';
import testAdapter from '../../test-adapter.js';

const storageConfig = {
	url: new URL('./.astro/content.db', import.meta.url).toString(),
};

export default defineConfig({
	output: 'server',
	adapter: testAdapter({
		extendAdapter: {
			contentCollectionStorage: createContentCollectionStorage(storageConfig),
		},
	}),
});
