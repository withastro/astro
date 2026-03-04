import { fileURLToPath } from 'node:url';
import { loadFixture as baseLoadFixture } from './test-utils.js';

/**
 * Registry for shared fixtures to avoid creating multiple fixture instances
 * when running multiple test files in the same process.
 */
const fixtureRegistry = new Map();
const loadPromises = new Map();
const buildPromises = new Map();

/**
 * Get or create a shared fixture. If a fixture with the same root path has already been
 * loaded, it will be reused. Otherwise, a new fixture will be created.
 *
 * The fixture is NOT automatically built - call fixture.build() when needed.
 *
 * @param {Object} options
 * @param {string} options.root - Root directory for the fixture
 * @param {Object} options.config - Additional config options for the fixture
 * @returns {Promise<import('./test-utils').Fixture>}
 */
export async function getSharedFixture({ root, ...config }) {
	if (!root) {
		throw new Error('Shared fixture must have a root path');
	}

	// Resolve the root path to an absolute path
	const resolvedRoot = fileURLToPath(new URL(root, import.meta.url));

	// Use the resolved path as the cache key
	const cacheKey = resolvedRoot;

	// Check if we already have this fixture
	if (fixtureRegistry.has(cacheKey)) {
		return fixtureRegistry.get(cacheKey);
	}

	// Check if another test is already loading this fixture
	if (loadPromises.has(cacheKey)) {
		await loadPromises.get(cacheKey);
		return fixtureRegistry.get(cacheKey);
	}

	// Create the fixture (but don't build it)
	const loadPromise = (async () => {
		const fixture = await baseLoadFixture({ root, ...config });

		// Override the build method to ensure it's only built once
		const originalBuild = fixture.build.bind(fixture);
		fixture.build = async function () {
			if (buildPromises.has(cacheKey)) {
				// Another test is already building, wait for it
				return buildPromises.get(cacheKey);
			}

			if (fixture._built) {
				// Already built, no-op
				return;
			}

			// Start the build
			const buildPromise = originalBuild();
			buildPromises.set(cacheKey, buildPromise);

			try {
				await buildPromise;
				fixture._built = true;
			} finally {
				buildPromises.delete(cacheKey);
			}
		};

		// Add a flag to indicate this is a shared fixture
		fixture._isShared = true;
		fixture._sharedCacheKey = cacheKey;

		// Store the fixture
		fixtureRegistry.set(cacheKey, fixture);

		return fixture;
	})();

	loadPromises.set(cacheKey, loadPromise);

	try {
		const fixture = await loadPromise;
		return fixture;
	} finally {
		// Clean up the load promise
		loadPromises.delete(cacheKey);
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

	const cacheKey = fixture._sharedCacheKey;

	if (previewServers.has(cacheKey)) {
		return previewServers.get(cacheKey);
	}

	const server = await fixture.preview();
	previewServers.set(cacheKey, server);
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

	const cacheKey = fixture._sharedCacheKey;

	if (devServers.has(cacheKey)) {
		return devServers.get(cacheKey);
	}

	const server = await fixture.startDevServer();
	devServers.set(cacheKey, server);
	return server;
}

/**
 * Stop all shared preview servers
 */
async function stopAllPreviewServers() {
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
 * Shared fixture system for Astro tests
 *
 * This module provides utilities to share built fixtures across multiple test files
 * to reduce total test execution time.
 *
 * LIMITATIONS:
 * - Cannot test multiple build configurations with the same fixture
 * - All tests using a shared fixture must use identical config settings
 * - Tests that need to verify different build outputs (with/without base path,
 *   different asset configurations, etc.) cannot use shared fixtures
 * - Dev/preview servers are shared - tests must be careful about isolation
 */
async function stopAllDevServers() {
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
