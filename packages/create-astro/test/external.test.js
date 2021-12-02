import assert from 'assert';
import { execa } from 'execa';
import { FIXTURES_URL } from './helpers.js';
import { existsSync } from 'fs';

async function run(outdir, template) {
  //--template cassidoo/shopify-react-astro
  await execa('../../create-astro.mjs', [outdir, '--template', template, '--force-overwrite'], {
    cwd: FIXTURES_URL.pathname,
  });
}

const testCases = [['shopify', 'cassidoo/shopify-react-astro']];

async function tests() {
  for (let [dir, tmpl] of testCases) {
    await run(dir, tmpl);

    const outPath = new URL('' + dir, FIXTURES_URL);
    assert.ok(existsSync(outPath));
  }
}

tests().catch((err) => {
  console.error(err);
  process.exit(1);
});
