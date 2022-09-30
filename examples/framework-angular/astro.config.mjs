import { defineConfig } from 'astro/config';
import angular from '@analogjs/astro-angular';

// https://astro.build/config
export default defineConfig({
	integrations: [angular()],
});
