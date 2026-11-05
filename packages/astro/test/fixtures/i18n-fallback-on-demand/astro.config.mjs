import { defineConfig } from 'astro/config';

// The i18n configuration is passed inline by the test, which builds the same
// fixture once per `fallbackType`.
export default defineConfig({
	output: 'server',
});
