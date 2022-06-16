import { defineConfig, loadEnv } from 'astro/config';

const { MODE } = loadEnv();

export default defineConfig({
	site: `https://${MODE}.my-site.com`
})
