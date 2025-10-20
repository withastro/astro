// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, envField } from 'astro/config';

import mdx from '@astrojs/mdx';
import { fileURLToPath } from 'node:url';
import react from '@astrojs/react';

export default defineConfig({
	adapter: cloudflare({
		imageService: 'cloudflare-binding',
	}),
	vite: {
		resolve: {
			alias: {
				'@images': fileURLToPath(new URL('./images', import.meta.url)),
			},
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
	integrations: [mdx(), react()],
	env: {
		schema: {
			FOO: envField.string({ context: 'server', access: 'public' }),
			BAR: envField.string({ context: 'client', access: 'public' }),
			SECRET: envField.string({ context: 'server', access: 'secret' }),
		}
	}
});
