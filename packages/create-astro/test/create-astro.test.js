import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import execa from 'execa';
import del from 'del';
import * as assert from 'uvu/assert';
import { TEMPLATES } from '../dist/templates.js';

const CreateAstro = suite('npm init astro');

const cwd = fileURLToPath(path.dirname(import.meta.url));
const fixturesDir = path.join(cwd, 'fixtures');

CreateAstro.before(async () => {
  await del(fixturesDir);
  await fs.promises.mkdir(fixturesDir);
});

for (const { value: template } of TEMPLATES) {
  // TODO: Unskip once repo is made public. Because the repo is private, the templates can't yet be downloaded.
  CreateAstro.skip(template, async () => {
    const testDirectory = path.join(fixturesDir, template);
    const { stdout } = await execa('../../create-astro.mjs', [testDirectory, '--template', template, '--force-overwrite'], { cwd: path.join(cwd, 'fixtures') });

    console.log(stdout);
    // test: path should formatted as './{dirName}'
    assert.not.match(stdout, '././');

    const DOES_HAVE = ['.gitignore', 'package.json', 'public', 'src'];
    const DOES_NOT_HAVE = ['meta.json', 'node_modules', 'yarn.lock'];

    // test: template contains essential files & folders
    for (const file of DOES_HAVE) {
      console.log(path.join(testDirectory, file));
      assert.ok(fs.existsSync(path.join(testDirectory, file)), `has ${file}`);
    }

    // test: template DOES NOT contain files supposed to be stripped away
    for (const file of DOES_NOT_HAVE) {
      assert.not.ok(fs.existsSync(path.join(testDirectory, file)), `does not have ${file}`);
    }
  });
}

CreateAstro.run();
