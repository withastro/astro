#!/usr/bin/env node
/**
 * Quick test to verify JSX queue rendering is working
 */

import { loadFixture } from './packages/astro/test/test-utils.js';

console.log('\n🧪 Testing JSX Queue Rendering...\n');

// Build with queue rendering enabled
console.log('Building with queue rendering...');
const fixture = await loadFixture({
	root: './packages/astro/test/fixtures/jsx-queue-rendering/',
	experimental: {
		queuedRendering: true,
	},
});

await fixture.build();

// Check if stats are available (would need to export them)
console.log('\n✅ Build completed successfully!');
console.log('Check the build output above for "[JSX Queue]" messages.\n');
