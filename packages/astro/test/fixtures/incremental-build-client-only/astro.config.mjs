import { defineConfig } from 'astro/config';
import customRenderer from './src/renderer/integration.js';

export default defineConfig({
	integrations: [customRenderer()],
});
