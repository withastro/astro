import { defineConfig } from 'astro/config';
import mithril from '@astrojs/mithril';

// https://astro.build/config
export default defineConfig({
	// Enable Mithril to support Mithril JSX components.
	integrations: [mithril()],
});
