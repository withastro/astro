import { defineConfig } from 'astro/config';
import lit from '@astrojs/lit';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import turbolinks from '@astrojs/turbolinks';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import solid from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  integrations: [lit(), react(), tailwind(), turbolinks(), partytown(), sitemap(), solid()]
});