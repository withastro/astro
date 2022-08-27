import { defineConfig } from 'astro/config';
import jquery from '@astrojs/jquery';

// https://astro.build/config
export default defineConfig({
	integrations: [jquery()],
});
