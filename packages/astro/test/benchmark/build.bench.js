/** @todo migrate these to use the independent docs repository at https://github.com/withastro/docs */

import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import { build as astroBuild } from '#astro/build';
import { loadConfig } from '#astro/config';
import { Benchmark } from './benchmark.js';
import del from 'del';
import { Writable } from 'stream';
import { format as utilFormat } from 'util';

const snowpackExampleRoot = new URL('../../../../docs/', import.meta.url);

export const errorWritable = new Writable({
	objectMode: true,
	write(event, _, callback) {
		let dest = process.stderr;
		dest.write(utilFormat(...event.args));
		dest.write('\n');

		callback();
	},
});

let build;
async function setupBuild() {
	const astroConfig = await loadConfig(fileURLToPath(snowpackExampleRoot));

	const logging = {
		level: 'error',
		dest: errorWritable,
	};

	build = () => astroBuild(astroConfig, logging);
}

async function runBuild() {
	await build();
	return performance.now();
}

const benchmarks = [
	new Benchmark({
		name: 'Snowpack Example Build Uncached',
		root: snowpackExampleRoot,
		file: new URL('./build-uncached.json', import.meta.url),
		async setup() {
			process.chdir(new URL('../../../../', import.meta.url).pathname);
			const spcache = new URL('../../node_modules/.cache/', import.meta.url);
			await Promise.all([del(spcache.pathname, { force: true }), setupBuild()]);
		},
		run: runBuild,
	}),
	new Benchmark({
		name: 'Snowpack Example Build Cached',
		root: snowpackExampleRoot,
		file: new URL('./build-cached.json', import.meta.url),
		async setup() {
			process.chdir(new URL('../../../../', import.meta.url).pathname);
			await setupBuild();
			await this.execute();
		},
		run: runBuild,
	}),
	/*new Benchmark({
    name: 'Snowpack Example Dev Server Cached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-cached.json', import.meta.url),
    async setup() {
      // Execute once to make sure Snowpack is cached.
      await this.execute();
    }
  })*/
];

async function run() {
	for (const b of benchmarks) {
		await b.test();
	}
}

run().catch((err) => {
	console.error(err);
	process.exit(1);
});
