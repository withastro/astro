import { Benchmark } from './benchmark.js';
import del from 'del';

const snowpackExampleRoot = new URL('../../../../examples/snowpack/', import.meta.url);

const benchmarks = [
  new Benchmark({
    name: 'Snowpack Example Dev Server Uncached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-uncached.json', import.meta.url),
    async setup() {
      const spcache = new URL('../../node_modules/.cache/', import.meta.url);
      await del(spcache.pathname);
    }
  }),
  new Benchmark({
    name: 'Snowpack Example Dev Server Cached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-cached.json', import.meta.url),
    async setup() {
      // Execute once to make sure Snowpack is cached.
      await this.execute();
    }
  })
];

async function run() {
  for(const b of benchmarks) {
    await b.test();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});