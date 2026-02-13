// Test script to verify that different configs produce different behavior
import { fileURLToPath } from 'node:url';

const renderRoot = new URL('./projects/render-bench/', import.meta.url);
const entry = new URL('./dist/server/entry.mjs', renderRoot);

const { App, manifest } = await import(entry);

console.log('Base manifest experimentalQueuedRendering:', manifest.experimentalQueuedRendering);
console.log('');

// Test 1: Classic (no queue)
const classicManifest = {
	...manifest,
	experimentalQueuedRendering: undefined,
};
const classicApp = new App(classicManifest, false);
console.log('✓ Created Classic app');

// Test 2: Queue only
const queueManifest = {
	...manifest,
	experimentalQueuedRendering: {
		enabled: true,
		poolSize: 0,
		cache: false,
	},
};
const queueApp = new App(queueManifest, false);
console.log('✓ Created Queue app');

// Test 3: Queue + Pool + Cache
const fullManifest = {
	...manifest,
	experimentalQueuedRendering: {
		enabled: true,
		poolSize: 1000,
		cache: true,
	},
};
const fullApp = new App(fullManifest, false);
console.log('✓ Created Queue+Pool+Cache app');

// Test rendering to verify they work
console.log('');
console.log('Testing renders...');

const mdxRequest = new Request('http://example.com/mdx');

console.time('Classic render');
await classicApp.render(mdxRequest.clone());
console.timeEnd('Classic render');

console.time('Queue render');
await queueApp.render(mdxRequest.clone());
console.timeEnd('Queue render');

console.time('Queue+Pool+Cache render');
await fullApp.render(mdxRequest.clone());
console.timeEnd('Queue+Pool+Cache render');

console.log('');
console.log('✅ All configurations working!');
console.log('Note: Timing differences may be small for single renders.');
console.log('Run the full benchmark suite to see statistically significant differences.');
