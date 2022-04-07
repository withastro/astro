import lit from '@astrojs/lit';
import partytown from '@astrojs/partytown';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import turbolinks from '@astrojs/turbolinks';
import { defineConfig } from 'astro/config';

export default defineConfig({
	integrations: [lit(), react(), tailwind(), turbolinks(), partytown(), sitemap()],
});
