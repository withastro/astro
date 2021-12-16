import fs from 'fs';
import path from 'path';
import http from 'http';
import { green, red } from 'kleur/colors';
import { execa } from 'execa';
import glob from 'tiny-glob';
import { TEMPLATES } from '../dist/templates.js';
import { GITHUB_SHA, FIXTURES_DIR } from './helpers.js';

// helpers
async function fetch(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        // not OK
        if (res.statusCode !== 200) {
          reject(res.statusCode);
          return;
        }

        // OK
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      })
      .on('error', (err) => {
        // other error
        reject(err);
      });
  });
}

function assert(a, b, message) {
  if (a !== b) throw new Error(red(`✘ ${message}`));
  // console.log(green(`✔ ${message}`)); // don’t show successes
}

async function testTemplate(template) {
  const templateDir = path.join(FIXTURES_DIR, template);

  // test 1: install
  const DOES_HAVE = ['.gitignore', 'package.json', 'public', 'src'];
  const DOES_NOT_HAVE = ['.git', 'meta.json'];

  // test 1a: expect template contains essential files & folders
  for (const file of DOES_HAVE) {
    assert(fs.existsSync(path.join(templateDir, file)), true, `[${template}] has ${file}`);
  }
  // test 1b: expect template DOES NOT contain files supposed to be stripped away
  for (const file of DOES_NOT_HAVE) {
    assert(fs.existsSync(path.join(templateDir, file)), false, `[${template}] cleaned up ${file}`);
  }

  // test 2: build
  const MUST_HAVE_FILES = ['index.html', '_astro'];
  await execa('npm', ['run', 'build'], { cwd: templateDir });
  const builtFiles = await glob('**/*', { cwd: path.join(templateDir, 'dist') });
  // test 2a: expect all files built successfully
  for (const file of MUST_HAVE_FILES) {
    assert(builtFiles.includes(file), true, `[${template}] built ${file}`);
  }

  // test 3: dev server (should happen after build so dependency install can be reused)

  // TODO: fix dev server test in CI
  if (process.env.CI === true) {
    return;
  }

  // start dev server in background & wait until ready
  const templateIndex = TEMPLATES.findIndex(({ value }) => value === template);
  const port = 3000 + templateIndex; // use different port per-template
  const devServer = execa('npm', ['run', 'start', '--', '--port', port], { cwd: templateDir });
  let sigkill = setTimeout(() => {
    throw new Error(`Dev server failed to start`); // if 10s has gone by with no update, kill process
  }, 10000);

  // read stdout until "Server started" appears
  await new Promise((resolve, reject) => {
    devServer.stdout.on('data', (data) => {
      clearTimeout(sigkill);
      sigkill = setTimeout(() => {
        reject(`Dev server failed to start`);
      }, 10000);
      if (data.toString('utf8').includes('Server started')) resolve();
    });
    devServer.stderr.on('data', (data) => {
      reject(data.toString('utf8'));
    });
  });
  clearTimeout(sigkill); // done!

  // send request to dev server that should be ready
  const { statusCode, body } = (await fetch(`http://localhost:${port}`)) || {};

  // test 3a: expect 200 status code
  assert(statusCode, 200, `[${template}] 200 response`);
  // test 3b: expect non-empty response
  assert(body.length > 0, true, `[${template}] non-empty response`);

  // clean up
  devServer.kill();
}

async function testAll() {
  // setup
  await Promise.all(
    TEMPLATES.map(async ({ value: template }) => {
      // setup: `npm init astro`
      await execa('../../create-astro.mjs', [template, '--template', template, '--commit', GITHUB_SHA, '--force-overwrite'], {
        cwd: FIXTURES_DIR,
      });
      // setup: `npm install` (note: running multiple `yarn`s in parallel in CI will conflict)
      await execa('npm', ['install', '--no-package-lock', '--silent'], { cwd: path.join(FIXTURES_DIR, template) });
    })
  );

  // test (note: not parallelized because Snowpack HMR reuses same port in dev)
  for (let n = 0; n < TEMPLATES.length; n += 1) {
    const template = TEMPLATES[n].value;

    try {
      await testTemplate(template);
    } catch (err) {
      console.error(red(`✘ [${template}]`));
      throw err;
    }

    console.info(green(`✔ [${template}] All tests passed (${n + 1}/${TEMPLATES.length})`));
  }
}
testAll();
