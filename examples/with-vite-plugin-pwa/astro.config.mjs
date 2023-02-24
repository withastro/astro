import { defineConfig } from 'astro/config';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
	integrations: [
		AstroPWA({
			mode: 'development',
			base: '/',
			scope: '/',
			registerType: 'autoUpdate',
			manifest: {
				name: 'Astro PWA',
				short_name: 'Astro PWA',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'favicon.svg',
						sizes: 'any',
						type: 'image/svg+xml',
						purpose: 'any maskable',
					},
				],
			},
			workbox: {
				globPatterns: ['**/*.{css,js,html,svg}'],
			},
			devOptions: {
				enabled: true,
				navigateFallback: '/',
			},
		}),
	],
});
