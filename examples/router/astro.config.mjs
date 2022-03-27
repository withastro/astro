import { defineConfig } from 'astro/config';
import spa from "@astrojs/spa";

// https://astro.build/config
export default defineConfig({
  integrations: [
		spa()
	]
});
