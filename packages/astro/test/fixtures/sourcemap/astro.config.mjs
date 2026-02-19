import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [react()],
	vite: {
		environments: {
			client: {
				build: {
					sourcemap: true,
				}
			}
		}
	}
})
