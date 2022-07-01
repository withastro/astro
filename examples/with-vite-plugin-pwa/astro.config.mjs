import { defineConfig } from 'astro/config';
import pwa from '@astrojs/pwa';
import replace from '@rollup/plugin-replace';

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

const replaceOptions = {
	__DATE__: `${new Date().toISOString()}`,
	include: [/\.(ts|astro)$/],
}

const reload = process.env.RELOAD_SW === 'true'

if (process.env.SW === 'true') {
	pwaOptions.srcDir = 'src'
	pwaOptions.filename = 'claims-sw.ts'
	pwaOptions.strategies = 'injectManifest'
	pwaOptions.manifest.description = 'Astro PWA Inject Manifest'
} 

if (reload) {
	// @ts-ignore
	replaceOptions.__RELOAD_SW__ = 'true'
}

// https://astro.build/config
export default defineConfig({
	integrations: [pwa(pwaOptions)],
	vite: {
		resolve: {
			alias: {
				'workbox-window': './node_modules/workbox-window/build/workbox-window.prod.es5.mjs'
			},
		},
		optimizeDeps: {
			include: ['workbox-window']
		},
		logLevel: 'info',
		build: {
			sourcemap: process.env.SOURCE_MAP === 'true',
		},
		plugins:[replace(replaceOptions)]
	}
});
