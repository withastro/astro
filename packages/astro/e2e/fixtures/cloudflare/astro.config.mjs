// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';
import preact from '@astrojs/preact';
import vue from "@astrojs/vue"

export default defineConfig({
	adapter: cloudflare({
		imageService: 'cloudflare-binding',
		sessionKVBindingName: "SESSION"
	}),
	build: {
		inlineStylesheets: 'never'
	},
	vite: {
		resolve: {
			alias: {
				'@images': fileURLToPath(new URL('./images', import.meta.url)),
			},
		},
		optimizeDeps: {
			// Pre-bundle the Preact SSR renderer so the dev server's dep optimizer
			// doesn't discover it in a second pass, which deletes the pre-bundled
			// worker entrypoint that workerd still references and crashes the dev
			// server. See https://github.com/withastro/astro/issues/16248.
			include: ['preact', 'preact-render-to-string'],
		},
	},
	i18n: {
		defaultLocale: "en",
		locales: ["en", "fr"],
		routing: {
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false
		},
		fallback: {
			"fr": "en"
		}
	},
	integrations: [
		mdx(),
		react({ include: ['**/react/*'] }),
		preact({ include: ['**/preact/*'] }),
		vue(),
	],
	env: {
		schema: {
			FOO: envField.string({ context: 'server', access: 'public' }),
			BAR: envField.string({ context: 'client', access: 'public' }),
			SECRET: envField.string({ context: 'server', access: 'secret' }),
		}
	},
	fonts: [{
		provider: fontProviders.google(),
		name: "Roboto",
		cssVariable: "--font-roboto"
	}]
});
