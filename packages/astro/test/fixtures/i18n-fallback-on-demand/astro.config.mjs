import { defineConfig } from 'astro/config';

// The i18n configuration is passed inline by the test so each fallback type
// builds into its own outDir.
export default defineConfig({
	output: 'server',
});
