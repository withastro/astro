import { fileURLToPath } from 'url';
import v8 from 'v8';
import dev from '../../packages/astro/dist/core/dev/index.js';
import { loadConfig } from '../../packages/astro/dist/core/config.js';
import prettyBytes from 'pretty-bytes';

if (!global.gc) {
	console.error('ERROR: Node must be run with --expose-gc');
	process.exit(1);
}

const isCI = process.argv.includes('--ci');

/** URL directory containing the entire project. */
const projDir = new URL('./project/', import.meta.url);

let config = await loadConfig({
	cwd: fileURLToPath(projDir),
});

config.buildOptions.experimentalStaticBuild = true;

const server = await dev(config, { logging: { level: 'error' } });

// Prime the server so initial memory is created
await fetch(`http://localhost:3000/page-0`);

async function run() {
	for (let i = 0; i < 100; i++) {
		let path = `/page-${i}`;
		await fetch(`http://localhost:3000${path}`);
	}
}

global.gc();
const startSize = v8.getHeapStatistics().used_heap_size;

// HUMAN mode: Runs forever. Optimized for accurate results on each snapshot Slower than CI.
if (!isCI) {
	console.log(`Greetings, human. This test will run forever. Run with the "--ci" flag to finish with a result.`);
	let i = 1;
	while (i++) {
		await run();
		global.gc();
		const checkpoint = v8.getHeapStatistics().used_heap_size;
		console.log(`Snapshot ${String(i).padStart(3, '0')}: ${(checkpoint / startSize) * 100}%`);
	}
}

// CI mode: Runs 100 times. Optimized for speed with an accurate final result.
for (let i = 0; i < 100; i++) {
	await run();
	const checkpoint = v8.getHeapStatistics().used_heap_size;
	console.log(`Estimate ${String(i).padStart(3, '0')}/100: ${(checkpoint / startSize) * 100}%`);
}

console.log(`Test complete. Running final garbage collection...`);
global.gc();
const endSize = v8.getHeapStatistics().used_heap_size;

// If the trailing average is higher than the median, see if it's more than 5% higher
let percentage = endSize / startSize;
const TEST_THRESHOLD = 1.2;
const isPass = percentage < TEST_THRESHOLD;
console.log(``);
console.log(`Result: ${isPass ? 'PASS' : 'FAIL'} (${percentage * 100}%)`);
console.log(`Memory usage began at ${prettyBytes(startSize)} and finished at ${prettyBytes(endSize)}.`);
console.log(`The threshold for a probable memory leak is ${TEST_THRESHOLD * 100}%`);
console.log(``);
console.log(`Exiting...`);
await server.stop();
process.exit(isPass ? 0 : 1);
