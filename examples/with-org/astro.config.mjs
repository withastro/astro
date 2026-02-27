// @ts-check

import orgMode from '@astrojs/org-mode';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [orgMode()],
});
