import preact from '@astrojs/preact';
import solid from '@astrojs/solid-js';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [preact(), solid()],
});
