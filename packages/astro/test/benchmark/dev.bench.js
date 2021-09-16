import { performance } from 'perf_hooks';
import { Benchmark } from './benchmark.js';
import { runDevServer } from '../helpers.js';
import del from 'del';

const docsExampleRoot = new URL('../../../../docs/', import.meta.url);

async function runToStarted(root) {
  const args = [];
  const process = runDevServer(root, args);

  let started = null;
  process.stdout.setEncoding('utf8');
  for await (const chunk of process.stdout) {
    if (/Server started/.test(chunk)) {
      started = performance.now();
      break;
    }
  }

  process.kill();
  return started;
}

const benchmarks = [
  new Benchmark({
    name: 'Docs Site Example Dev Server Uncached',
    root: docsExampleRoot,
    file: new URL('./dev-server-uncached.json', import.meta.url),
    async setup() {
      const spcache = new URL('../../node_modules/.cache/', import.meta.url);
      await del(spcache.pathname);
    },
    run({ root }) {
      return runToStarted(root);
    },
  }),
  new Benchmark({
    name: 'Docs Site Example Dev Server Cached',
    root: docsExampleRoot,
    file: new URL('./dev-server-cached.json', import.meta.url),
    async setup() {
      // Execute once to make sure Docs Site is cached.
      await this.execute();
    },
    run({ root }) {
      return runToStarted(root);
    },
  }),
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
