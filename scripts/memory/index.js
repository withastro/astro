import { execa } from 'execa';
import { fileURLToPath } from 'url';
import v8 from 'v8';
import dev from '../../packages/astro/dist/core/dev/index.js';
import { loadConfig } from '../../packages/astro/dist/core/config.js';
import prettyBytes from 'pretty-bytes';

/** URL directory containing the entire project. */
const projDir = new URL('./project/', import.meta.url);

function mean(numbers) {
	var total = 0, i;
	for (i = 0; i < numbers.length; i += 1) {
			total += numbers[i];
	}
	return total / numbers.length;
}

function median(numbers) {
	// median of [3, 5, 4, 4, 1, 1, 2, 3] = 3
	var median = 0, numsLen = numbers.length;
	numbers.sort();

	if (
			numsLen % 2 === 0 // is even
	) {
			// average of two middle numbers
			median = (numbers[numsLen / 2 - 1] + numbers[numsLen / 2]) / 2;
	} else { // is odd
			// middle number only
			median = numbers[(numsLen - 1) / 2];
	}

	return median;
}

let config = await loadConfig({
	cwd: fileURLToPath(projDir)
});

config.buildOptions.experimentalStaticBuild = true;

const server = await dev(config, { logging: 'error'});

// Prime the server so initial memory is created
await fetch(`http://localhost:3000/page-0`);

const sizes = [];

function addSize() {
	sizes.push(v8.getHeapStatistics().total_heap_size);
}

async function run() {
	addSize();
	for(let i = 0; i < 100; i++) {
		let path = `/page-${i}`;
		await fetch(`http://localhost:3000${path}`);
	}
	addSize();
}

for(let i = 0; i < 100; i++) {
	await run();
}

let lastThirthy = sizes.slice(sizes.length - 30);
let averageOfLastThirty = mean(lastThirthy);
let medianOfAll = median(sizes);

// If the trailing average is higher than the median, see if it's more than 5% higher
if(averageOfLastThirty > medianOfAll) {
	let percentage = Math.abs(averageOfLastThirty - medianOfAll) / medianOfAll;
	if(percentage > .05) {
		throw new Error(`The average towards the end (${prettyBytes(averageOfLastThirty)}) is more than 5% higher than the median of all runs (${prettyBytes(medianOfAll)}). This tells us that memory continues to grow and a leak is likely.`)
	}
}



await server.stop();
