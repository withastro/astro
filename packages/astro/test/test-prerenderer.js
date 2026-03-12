/**
 * @typedef {import('../src/types/public/integrations.js').AstroIntegration} AstroIntegration
 * @typedef {import('../src/types/public/integrations.js').AstroPrerenderer} AstroPrerenderer
 * @typedef {import('../src/types/public/integrations.js').PathWithRoute} PathWithRoute
 * @typedef {import('../src/types/public/internal.js').RouteData} RouteData
 */

/**
 * Creates a test integration that sets a custom prerenderer.
 * The prerenderer tracks calls made to it for testing purposes.
 *
 * @param {{
 *   onSetup?: () => void;
 *   onGetStaticPaths?: () => void;
 *   onRender?: (request: Request, routeData: RouteData) => void;
 *   onTeardown?: () => void;
 * }} [callbacks]
 * @returns {{
 *   integration: AstroIntegration;
 *   calls: { setup: number; getStaticPaths: number; render: number; teardown: number };
 *   renderedPaths: string[];
 * }}
 */
export default function createTestPrerenderer(callbacks = {}) {
	const calls = {
		setup: 0,
		getStaticPaths: 0,
		render: 0,
		teardown: 0,
	};

	const renderedPaths = [];

	const integration = {
		name: 'test-prerenderer-integration',
		hooks: {
			'astro:build:start': ({ setPrerenderer }) => {
				// Use factory function to receive the default prerenderer
				setPrerenderer((defaultPrerenderer) => ({
					name: 'test-prerenderer',

					async setup() {
						calls.setup++;
						callbacks.onSetup?.();
						// Delegate to the default prerenderer's setup
						if (defaultPrerenderer?.setup) {
							await defaultPrerenderer.setup();
						}
					},

					async getStaticPaths() {
						calls.getStaticPaths++;
						callbacks.onGetStaticPaths?.();
						// Delegate to the default prerenderer
						return defaultPrerenderer.getStaticPaths();
					},

					async render(request, { routeData }) {
						calls.render++;
						const url = new URL(request.url);
						renderedPaths.push(url.pathname);
						callbacks.onRender?.(request, routeData);
						// Delegate to the default prerenderer
						return defaultPrerenderer.render(request, { routeData });
					},

					async teardown() {
						calls.teardown++;
						callbacks.onTeardown?.();
						// Delegate to the default prerenderer's teardown
						if (defaultPrerenderer?.teardown) {
							await defaultPrerenderer.teardown();
						}
					},
				}));
			},
		},
	};

	return {
		integration,
		calls,
		renderedPaths,
	};
}
