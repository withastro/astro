#!/usr/bin/env node
/* eslint-disable no-console */
'use strict';
const pkg = require('./package.json');
const semver = require('semver');
const ci = require('ci-info');
const CI_INTRUCTIONS = {
  NETLIFY: 'https://docs.netlify.com/configure-builds/manage-dependencies/#node-js-and-javascript',
  GITHUB_ACTIONS: 'https://docs.github.com/en/actions/guides/building-and-testing-nodejs#specifying-the-nodejs-version',
  VERCEL: 'https://vercel.com/docs/runtimes#official-runtimes/node-js/node-js-version',
};

/** Dynamically import the CLI after checking if this version of Node is supported */
async function main() {
  const engines = pkg.engines.node;
  const version = process.versions.node;
  const isSupported = semver.satisfies(version, engines);

  if (!isSupported) {
    console.error(`\nNode.js v${version} is not supported by Astro!
Please upgrade to one of Node.js ${engines}.\n`);
    if (ci.isCI) {
      let platform;
      for (const [key, value] of Object.entries(ci)) {
        if (value === true) {
          platform = key;
          break;
        }
      }
      console.log(`To set the Node.js version for ${ci.name}, reference the official documentation`);
      if (CI_INTRUCTIONS[platform]) console.log(CI_INTRUCTIONS[platform]);
    }
    process.exit(1);
  }

  await import('./dist/cli.js').then(({ cli }) => cli(process.argv));
}

main();
