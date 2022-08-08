/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
	test: {
		setupFiles: ['./vitest.setup.ts']
	},
});
