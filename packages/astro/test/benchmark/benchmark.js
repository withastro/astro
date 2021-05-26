import { promises as fsPromises, existsSync } from 'fs';
import { performance } from 'perf_hooks';
import { runDevServer } from '../helpers.js';

const MUST_BE_AT_LEAST_PERC_OF = 90;

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

export class Benchmark {
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
      if(Math.floor(data.time / time * 100) > MUST_BE_AT_LEAST_PERC_OF) {
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
