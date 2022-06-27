import { defineConfig, loadEnv } from 'astro/config';

const { MODE } = await loadEnv();

export default defineConfig({
	site: `https://${MODE}.my-site.com`
})
