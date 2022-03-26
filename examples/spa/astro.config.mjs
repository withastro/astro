import { defineConfig } from 'astro/config';
import spa from "@astrojs/spa";
import vue from "@astrojs/vue";

// https://astro.build/config
export default defineConfig({
  integrations: [
		spa(),
		vue()
	]
});
