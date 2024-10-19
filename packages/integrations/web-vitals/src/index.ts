import { defineDbIntegration } from '@astrojs/db/utils';
import { AstroError } from 'astro/errors';
import { WEB_VITALS_ENDPOINT_PATH } from './constants.js';

export default function webVitals({ deprecated }: { deprecated?: boolean } = {}) {
	process.env.DEPRECATE_WEB_VITALS = deprecated ? 'true' : undefined;
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
						'Run `npx astro add db` to install `@astrojs/db` and add it to your Astro config.',
					);
				}

				if (config.output !== 'hybrid' && config.output !== 'server') {
					throw new AstroError(
						'No SSR adapter found.',
						'`@astrojs/web-vitals` requires your site to be built with `hybrid` or `server` output.\n' +
							'Please add an SSR adapter: https://docs.astro.build/en/guides/server-side-rendering/',
					);
				}

				// Middleware that adds a `<meta>` tag to each page.
				addMiddleware({ entrypoint: '@astrojs/web-vitals/middleware', order: 'post' });
				// Endpoint that collects metrics and inserts them in Astro DB.
				injectRoute({
					entrypoint: '@astrojs/web-vitals/endpoint',
					pattern: WEB_VITALS_ENDPOINT_PATH + '/[...any]',
					prerender: false,
				});
				// Client-side performance measurement script.
				injectScript('page', `import '@astrojs/web-vitals/client-script';`);
			},
		},
	});
}
