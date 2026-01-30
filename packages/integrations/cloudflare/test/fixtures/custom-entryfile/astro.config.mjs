import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';


export default defineConfig({
	adapter: cloudflare({
		workerEntryPoint: {
			path: 'src/worker.ts',
			namedExports: ['default', 'MyDurableObject']
		}
	}),
});
