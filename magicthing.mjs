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
  const magicConfig = (await import(pathJoin(root, 'magicthing.config.mjs'))).default;
  magicConfig.projectRoot = new URL(magicConfig.projectRoot + '/', fileProtocolRoot);
  magicConfig.hmxRoot = new URL(magicConfig.hmxRoot + '/', fileProtocolRoot);


  // Should use an args parser eventually
  if(process.argv.includes('--generate')) {
    return generate(magicConfig);
  } else {
    return devServer(magicConfig);
  }
}

run().catch(err => setTimeout(() => {throw err}));