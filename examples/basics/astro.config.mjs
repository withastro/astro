// @ts-check

import skills from '@astrojs/skills';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	integrations: [skills()],
});
