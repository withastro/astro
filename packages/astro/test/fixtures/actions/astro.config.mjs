import { defineConfig } from 'astro/config';
import testAdapter from '../../test-adapter.js'

// https://astro.build/config
export default defineConfig({
	output: 'server',
	adapter: testAdapter(),
	// we stub actions coming from another domain for testing purposes
	security: {
		checkOrigin: false
	}
});
