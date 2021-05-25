import { Benchmark } from './benchmark.js';
import { suite } from 'uvu';
import del from 'del';

const DevServer = suite('Dev Server Benchmark');

const snowpackExampleRoot = new URL('../../../../examples/snowpack/', import.meta.url);

DevServer('Snowpack Example Dev Server Uncached', async () => {
  const b = new Benchmark({
    name: 'Snowpack Example Dev Server Uncached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-uncached.json', import.meta.url),
    async setup() {
      const spcache = new URL('../../node_modules/.cache/', import.meta.url);
      await del(spcache.pathname);
    }
  });
  await b.test();
});

DevServer('Snowpack Example Dev Server Cached', async () => {
  const b = new Benchmark({
    name: 'Snowpack Example Dev Server Cached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-cached.json', import.meta.url),
    async setup() {
      // Execute once to make sure Snowpack is cached.
      await this.execute();
    }
  });
  await b.test();
});

DevServer.run();