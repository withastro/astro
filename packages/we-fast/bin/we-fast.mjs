#!/usr/bin/env node

import { runCLI } from '../dist/cli.js';

const args = process.argv.slice(2);
runCLI(args).catch((err) => {
  console.error('❌ WE-FAST CLI Error:', err);
  process.exit(1);
});
