import { loadFixture as baseLoadFixture } from './test-utils.js';

/**
 * Registry for shared fixtures to avoid creating multiple fixture instances
 * when running multiple test files in the same process.
 */
const fixtureRegistry = new Map();
const loadPromises = new Map();
const buildPromises = new Map();

/**
 * Get or create a shared fixture. If a fixture with the same name has already been
 * loaded, it will be reused. Otherwise, a new fixture will be created.
 *
 * The fixture is NOT automatically built - call fixture.build() when needed.
 *
 * @param {Object} options
 * @param {string} options.name - Unique name for this shared fixture (e.g., 'static', 'ssr')
 * @param {string} options.root - Root directory for the fixture
 * @param {Object} options.config - Additional config options for the fixture
 * @returns {Promise<import('./test-utils').Fixture>}
 */
export async function getSharedFixture({ name, root, ...config }) {
	if (!name) {
		throw new Error('Shared fixture must have a name');
	}

	// Check if we already have this fixture
	if (fixtureRegistry.has(name)) {
		return fixtureRegistry.get(name);
	}

	// Check if another test is already loading this fixture
	if (loadPromises.has(name)) {
		await loadPromises.get(name);
		return fixtureRegistry.get(name);
	}

	// Create the fixture (but don't build it)
	const loadPromise = (async () => {
		const fixture = await baseLoadFixture({ root, ...config });

		// Override the build method to ensure it's only built once
		const originalBuild = fixture.build.bind(fixture);
		fixture.build = async function () {
			if (buildPromises.has(name)) {
				// Another test is already building, wait for it
				return buildPromises.get(name);
			}

			if (fixture._built) {
				// Already built, no-op
				return;
			}

			// Start the build
			const buildPromise = originalBuild();
			buildPromises.set(name, buildPromise);

			try {
				await buildPromise;
				fixture._built = true;
			} finally {
				buildPromises.delete(name);
			}
		};

		// Add a flag to indicate this is a shared fixture
		fixture._isShared = true;
		fixture._sharedName = name;

		// Store the fixture
		fixtureRegistry.set(name, fixture);

		return fixture;
	})();

	loadPromises.set(name, loadPromise);

	try {
		const fixture = await loadPromise;
		return fixture;
	} finally {
		// Clean up the load promise
		loadPromises.delete(name);
	}
}

/**
 * Get a shared preview server for a fixture. This ensures only one preview server
 * is started per shared fixture.
 */
const previewServers = new Map();

export async function getSharedPreviewServer(fixture) {
	if (!fixture._isShared) {
		throw new Error('getSharedPreviewServer can only be used with shared fixtures');
	}

	const name = fixture._sharedName;

	if (previewServers.has(name)) {
		return previewServers.get(name);
	}

	const server = await fixture.preview();
	previewServers.set(name, server);
	return server;
}

/**
 * Get a shared dev server for a fixture. This ensures only one dev server
 * is started per shared fixture.
 */
const devServers = new Map();

export async function getSharedDevServer(fixture) {
	if (!fixture._isShared) {
		throw new Error('getSharedDevServer can only be used with shared fixtures');
	}

	const name = fixture._sharedName;

	if (devServers.has(name)) {
		return devServers.get(name);
	}

	const server = await fixture.startDevServer();
	devServers.set(name, server);
	return server;
}

/**
 * Stop all shared preview servers
 */
export async function stopAllPreviewServers() {
	const stopPromises = [];
	for (const [name, server] of previewServers) {
		stopPromises.push(
			server.stop().catch((err) => {
				console.error(`Error stopping preview server for ${name}:`, err);
			}),
		);
	}
	await Promise.all(stopPromises);
	previewServers.clear();
}

/**
 * Stop all shared dev servers
 */
export async function stopAllDevServers() {
	const stopPromises = [];
	for (const [name, server] of devServers) {
		stopPromises.push(
			server.stop().catch((err) => {
				console.error(`Error stopping dev server for ${name}:`, err);
			}),
		);
	}
	await Promise.all(stopPromises);
	devServers.clear();
}

/**
 * Stop all shared servers (both preview and dev)
 */
export async function stopAllServers() {
	await Promise.all([stopAllPreviewServers(), stopAllDevServers()]);
}
