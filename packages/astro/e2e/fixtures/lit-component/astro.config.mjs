import lit from '@astrojs/lit';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [lit()],
	devToolbar: {
		enabled: false,
	}
});
