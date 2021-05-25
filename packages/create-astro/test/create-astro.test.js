import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { suite } from 'uvu';
import execa from 'execa';
import del from 'del';
import * as assert from 'uvu/assert';

const CreateAstro = suite('npm init astro');

const cwd = fileURLToPath(new URL('./fixtures/', import.meta.url));

const templates = ['blank', 'starter'];

CreateAstro.before(async () => {
  await del(cwd);
  await fs.promises.mkdir(cwd);
});

for (const template of templates) {
  CreateAstro(template, async () => {
    const { stdout } = await execa('../../create-astro.js', [`./${template}`, '--template', template, '--skip-install'], { cwd });

    // test: path should formatted as './{dirName}'
    assert.not.match(stdout, '././');

    const DOES_HAVE = ['.gitignore', 'package.json', 'public', 'src'];
    const DOES_NOT_HAVE = ['_gitignore', 'meta.json', 'node_modules'];

    // test: template contains essential files & folders
    for (const file of DOES_HAVE) {
      assert.ok(fs.existsSync(path.join(cwd, template, file)), `has ${file}`);
    }

    // test: template DOES NOT contain files supposed to be stripped away
    for (const file of DOES_NOT_HAVE) {
      assert.not.ok(fs.existsSync(path.join(cwd, template, file)), `does not have ${file}`);
    }
  });
}

CreateAstro.run();
