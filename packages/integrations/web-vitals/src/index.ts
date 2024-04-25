import { defineDbIntegration } from '@astrojs/db/utils';
import { AstroError } from 'astro/errors';

export default function webVitals() {
	return defineDbIntegration({
		name: '@astrojs/web-vitals',
		hooks: {
			'astro:db:setup'({ extendDb }) {
				extendDb({ configEntrypoint: '@astrojs/web-vitals/db-config' });
			},

			'astro:config:setup'({ addMiddleware, config, injectRoute, injectScript }) {
				if (!config.integrations.find(({ name }) => name === 'astro:db')) {
					throw new AstroError(
						'Astro DB integration not found.',
						'Run `npx astro add db` to install `@astrojs/db` and add it to your Astro config.'
					);
				}

				// Middleware that adds a `<meta>` tag to each page.
				addMiddleware({ entrypoint: '@astrojs/web-vitals/middleware', order: 'post' });
				// Endpoint that collects metrics and inserts them in Astro DB.
				injectRoute({
					entrypoint: '@astrojs/web-vitals/endpoint',
					pattern: '/_/astro-vitals',
					prerender: false,
				});
				// Client-side performance measurement script.
				injectScript('page', `import '@astrojs/web-vitals/client-script';`);
			},
		},
	});
}
