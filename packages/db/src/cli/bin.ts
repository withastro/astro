#!/usr/bin/env node
import { cli } from './index.js';

async function main() {
    const [command, ...args] = process.argv.slice(2);
    await cli(command, args);
}

await main();
