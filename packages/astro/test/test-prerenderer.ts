import type { AstroIntegration } from '../src/types/public/integrations.js';
import type { RouteData } from '../src/types/public/internal.js';

interface TestPrerendererCallbacks {
	onSetup?: () => void;
	onGetStaticPaths?: () => void;
	onRender?: (request: Request, routeData: RouteData) => void;
	onTeardown?: () => void;
}

interface TestPrerendererCalls {
	setup: number;
	getStaticPaths: number;
	render: number;
	teardown: number;
}

interface TestPrerendererResult {
	integration: AstroIntegration;
	calls: TestPrerendererCalls;
	renderedPaths: string[];
}

/**
 * Creates a test integration that sets a custom prerenderer.
 * The prerenderer tracks calls made to it for testing purposes.
 */
export default function createTestPrerenderer(
	callbacks: TestPrerendererCallbacks = {},
): TestPrerendererResult {
	const calls: TestPrerendererCalls = {
		setup: 0,
		getStaticPaths: 0,
		render: 0,
		teardown: 0,
	};

	const renderedPaths: string[] = [];

	const integration: AstroIntegration = {
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
