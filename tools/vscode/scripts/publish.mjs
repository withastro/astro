import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import execa from 'execa';

/** Copies `astro-languageserver` to our file */
async function publish() {
  const p0 = execa('yarn', ['lerna', 'run', 'build', '--scope', 'astro-vscode', '--scope', 'astro-languageserver'], { all: true });
  p0.all.setEncoding('utf8');
  for await (const chunk of p0.all) {
    console.log(chunk);

    if (/lerna success/g.test(chunk)) {
      break;
    }

    if (/ERROR/g.test(chunk)) {
      process.exit(1);
    }
  }

  await execa('npm', ['install']);

  const p1 = execa('vsce', ['publish'], { all: true });

  p1.all.setEncoding('utf8');
  for await (const chunk of p1.all) {
    console.log(chunk);

    if (/DONE/g.test(chunk)) {
      break;
    }

    if (/ERROR/g.test(chunk)) {
      process.exit(1);
    }
  }

  p1.kill();
}

publish();
