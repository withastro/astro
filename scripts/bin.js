#!/usr/bin/env node
import cli from './index.js';

async function run() {
    const args = process.argv.slice(2);
    cli(...args);
}
