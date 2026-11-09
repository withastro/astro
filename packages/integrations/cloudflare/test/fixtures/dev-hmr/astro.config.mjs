import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
	adapter: cloudflare({ inspectorPort: false, persistState: false, remoteBindings: false }),
	integrations: [react()],
	output: 'server',
	server: { host: '127.0.0.1', port: 0 },
});
