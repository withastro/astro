import { promises as fsPromises, existsSync } from 'fs';
import { performance } from 'perf_hooks';
import { runDevServer, setup } from '../helpers.js';

const shouldSave = process.argv.includes('--save');

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

class Benchmark {
  constructor(options) {
    this.options = options;
    this.setup = options.setup || Function.prototype;
  }

  async execute() {
    const { root } = this.options;
    const start = performance.now();
    const end = await runToStarted(root);
    const time = Math.floor(end - start);
    return time;
  }

  async run() {
    const { file } = this.options;

    await this.setup();
    const time = await this.execute();
  
    if(existsSync(file)) {
      const raw = await fsPromises.readFile(file, 'utf-8');
      const data = JSON.parse(raw);
      if(time < data.time + 500) {
        this.withinPreviousRuns = true;
      } else {
        this.withinPreviousRuns = false;
      }
    }
    this.time = time;
  }

  report() {
    const { name } = this.options;
    console.log(name, 'took', this.time, 'ms');
  }

  check() {
    if(this.withinPreviousRuns === false) {
      throw new Error(`${this.options.name} ran too slowly`);
    }
  }

  async save() {
    const { file, name } = this.options;
    const data = JSON.stringify({
      name,
      time: this.time
    }, null, '  ');
    await fsPromises.writeFile(file, data, 'utf-8');
  }

  async test() {
    await this.run();
    if(shouldSave) {
      await this.save();
    }
    this.report();
    this.check();
  }
}

const snowpackExampleRoot = new URL('../../../../examples/snowpack/', import.meta.url);

const benchmarks = [
  new Benchmark({
    name: 'Snowpack Example Dev Server Uncached',
    root: snowpackExampleRoot,
    file: new URL('./dev-server-uncached.json', import.meta.url),
    async setup() {
      const spcache = new URL('../../node_modules/.cache/', import.meta.url);
      await fsPromises.rmdir(spcache, { recursive: true });
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
  }),
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