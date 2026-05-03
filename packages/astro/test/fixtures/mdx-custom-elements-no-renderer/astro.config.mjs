import mdx from '@astrojs/mdx';
import { defineConfig } from 'astro/config';

// No custom renderer — verifies graceful plain-HTML fallback for custom elements.
export default defineConfig({
	integrations: [mdx()],
});
