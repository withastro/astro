import { defineConfig } from 'astro/config';
import feature from './feature/plugin.mjs';

export default defineConfig({
	vite: { plugins: [feature()] },
});
