import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { suite } from 'uvu';
import execa from 'execa';
import del from 'del';
import glob from 'tiny-glob';
import * as assert from 'uvu/assert';
import { TEMPLATES } from '../dist/templates.js';

// config
const GITHUB_SHA = process.env.GITHUB_SHA || execa.sync('git', ['rev-parse', 'HEAD']).stdout; // process.env.GITHUB_SHA will be set in CI; if testing locally execa() will gather this
const MAX_TEST_TIME = 60000; // maximum time a test may take (60s)
const TIMER = {}; // keep track of every test’s run time (uvu requires manual setup for this)
const FIXTURES_DIR = path.join(fileURLToPath(path.dirname(import.meta.url)), 'fixtures');

// helper
async function fetch(url) {
  return new Promise((resolve) => {
    http
      .get(url, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => resolve({ statusCode: res.statusCode, body }));
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

// test
const CreateAstro = suite('npm init astro');

CreateAstro.before(async () => {
  // clean install dir
  await del(FIXTURES_DIR);
  await fs.promises.mkdir(FIXTURES_DIR);

  // install all templates & deps before running tests
  await Promise.all(
    TEMPLATES.map(async ({ value: template }) => {
      const templateDir = path.join(FIXTURES_DIR, template);
      await execa('../../create-astro.mjs', [templateDir, '--template', template, '--commit', GITHUB_SHA, '--force-overwrite'], {
        cwd: FIXTURES_DIR,
      });
      await execa('yarn', ['--frozen-lockfile', '--silent'], { cwd: templateDir });
    })
  );
});

// enforce MAX_TEST_TIME
CreateAstro.before.each(({ __test__ }) => {
  if (TIMER[__test__]) throw new Error(`Test "${__test__}" already declared`);
  TIMER[__test__] = setTimeout(() => {
    throw new Error(`"${__test__}" did not finish within allowed time`);
  }, MAX_TEST_TIME);
});
CreateAstro.after.each(({ __test__ }) => {
  clearTimeout(TIMER[__test__]);
});

for (let n = 0; n < TEMPLATES.length; n++) {
  const template = TEMPLATES[n].value;
  const templateDir = path.join(FIXTURES_DIR, template);

  CreateAstro(`${template} (install)`, async () => {
    const DOES_HAVE = ['.gitignore', 'package.json', 'public', 'src'];
    const DOES_NOT_HAVE = ['.git', 'meta.json'];

    // test: template contains essential files & folders
    for (const file of DOES_HAVE) {
      assert.ok(fs.existsSync(path.join(templateDir, file)), `missing ${file}`);
    }

    // test: template DOES NOT contain files supposed to be stripped away
    for (const file of DOES_NOT_HAVE) {
      assert.not.ok(fs.existsSync(path.join(templateDir, file)), `failed to clean up ${file}`);
    }
  });

  CreateAstro(`${template} (dev)`, async () => {
    // start dev server
    const port = 3000 + n; // start new port per test
    const devServer = execa('yarn', ['start', '--port', port], { cwd: templateDir });
    await new Promise((resolve) => {
      setTimeout(() => resolve(), 15000);
    }); // give dev server flat 15s to set up
    // TODO: try to ping dev server ASAP rather than waiting flat 15s

    // ping dev server
    const { statusCode, body } = await fetch(`http://localhost:${port}`);

    // expect 200 to be returned with some response
    assert.equal(statusCode, 200, 'didn’t respond with 200');
    assert.ok(body, 'returned empty response');

    // clean up
    devServer.kill();
  });

  CreateAstro(`${template} (build)`, async () => {
    const MUST_HAVE_FILES = ['index.html', '_astro'];

    // build template
    await execa('yarn', ['build'], { cwd: templateDir });

    // scan build dir
    const builtFiles = await glob('**/*', { cwd: path.join(templateDir, 'dist') });
    for (const file of MUST_HAVE_FILES) {
      assert.ok(builtFiles.includes(file), `didn’t build ${file}`);
    }
  });
}

// run tests
CreateAstro.run();
