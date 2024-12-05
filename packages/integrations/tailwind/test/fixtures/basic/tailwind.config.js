import path from 'node:path';

/** @type {import('tailwindcss').Config} */
export default {
	content: [path.join(__dirname, 'src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}')],
};
