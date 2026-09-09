/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
	test: {
		/* for example, use global to avoid globals imports (describe, test, expect): */
		// globals: true,
	},
});
