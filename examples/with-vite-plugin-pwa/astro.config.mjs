import { defineConfig } from 'astro/config';
import pwa from '@astrojs/pwa';

const pwaOptions = {
	mode: 'development',
	base: '/',
	registerType: 'autoUpdate',
	includeAssets: ['favicon.svg'],
	manifest: {
		name: 'Astro PWA',
		short_name: 'Astro PWA',
		description: 'Astro PWA Auto Generate',
		theme_color: '#ffffff',
		icons: [
			{
				src: 'pwa-192x192.png', // <== don't add slash, for testing
				sizes: '192x192',
				type: 'image/png',
			},
			{
				src: '/pwa-512x512.png', // <== don't remove slash, for testing
				sizes: '512x512',
				type: 'image/png',
			},
			{
				src: 'pwa-512x512.png', // <== don't add slash, for testing
				sizes: '512x512',
				type: 'image/png',
				purpose: 'any maskable',
			},
		],
	},
	devOptions: {
		enabled: process.env.SW_DEV === 'true',
		/* when using generateSW the PWA plugin will switch to classic */
		type: 'module',
		navigateFallback: '/',
	},
}

if (process.env.SW === 'true') {
	pwaOptions.srcDir = 'src'
	pwaOptions.filename = 'claims-sw.ts'
	pwaOptions.strategies = 'injectManifest'
	pwaOptions.manifest.description = 'Astro PWA Inject Manifest'
}

// https://astro.build/config
export default defineConfig({
	integrations: [pwa(pwaOptions)],
	vite: {
		define: {
			'__DATE__': `'${new Date().toISOString()}'`
		},
		logLevel: 'info',
		build: {
			sourcemap: process.env.SOURCE_MAP === 'true',
		}
	}
});
