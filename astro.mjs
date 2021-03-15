#!/usr/bin/env node
import { join as pathJoin, resolve as pathResolve } from 'path';

import generate from './lib/generate.js';
import devServer from './lib/dev.js';

const root = pathResolve(process.argv[2]);

if(!root) {
  console.error('Must provide a project root');
  process.exit(1);
}

const fileProtocolRoot = `file://${root}/`;

async function run() {
  const astroConfig = (await import(pathJoin(root, 'astro.config.mjs'))).default;
  astroConfig.projectRoot = new URL(astroConfig.projectRoot + '/', fileProtocolRoot);
  astroConfig.hmxRoot = new URL(astroConfig.hmxRoot + '/', fileProtocolRoot);


  // Should use an args parser eventually
  if(process.argv.includes('--generate')) {
    return generate(astroConfig);
  } else {
    return devServer(astroConfig);
  }
}

run().catch(err => setTimeout(() => {throw err}));