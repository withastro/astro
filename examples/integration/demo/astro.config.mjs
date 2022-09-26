import { defineConfig } from 'astro/config';
import myIntegration from '@example/my-integration';

// https://astro.build/config
export default defineConfig({
	integrations: [myIntegration()]
});
