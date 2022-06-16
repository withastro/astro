import { defineConfig, loadEnv } from 'astro/config';

const { MODE, PROD, DEV } = loadEnv();
console.log({ MODE, PROD, DEV })

export default defineConfig({
	site: `https://${MODE}.my-site.com`
})
