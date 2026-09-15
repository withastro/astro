import { defineConfig } from 'astro/config';

export default defineConfig({
	// `auto` would inline this small sheet and hide the broken `<link href>`.
	build: { inlineStylesheets: 'never' },
});
