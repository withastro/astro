/// <reference types="vitest" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
	test: {
		/* for example, use global to avoid globals imports (describe, test, expect): */
		// globals: true,
		onConsoleLog(log: string, type: 'stdout' | 'stderr'): boolean | void {
			console.log(log);
			return false;
		},
	},
});
