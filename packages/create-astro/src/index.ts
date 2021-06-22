import fs from 'fs';
import path from 'path';
import { bold, cyan, gray, green, red } from 'kleur/colors';
import prompts from 'prompts';
import degit from 'degit';
import yargs from 'yargs-parser';
import { TEMPLATES } from './templates.js';
const args = yargs(process.argv);
prompts.override(args);

export function mkdirp(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e) {
    if (e.code === 'EEXIST') return;
    throw e;
  }
}

const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const POSTPROCESS_FILES = ['package.json']; // some files need processing after copying.

export async function main() {
  console.log('\n' + bold('Welcome to Astro!') + gray(` (create-astro v${version})`));
  console.log(`If you encounter a problem, visit ${cyan('https://github.com/snowpackjs/astro/issues')} to search or file a new issue.\n`);

  console.log(green(`>`) + gray(` Prepare for liftoff.`));
  console.log(green(`>`) + gray(` Gathering mission details...`));

  const cwd = args['_'][2] || '.';
  if (fs.existsSync(cwd)) {
    if (fs.readdirSync(cwd).length > 0) {
      const response = await prompts({
        type: 'confirm',
        name: 'forceOverwrite',
        message: 'Directory not empty. Continue?',
        initial: false,
      });
      if (!response.forceOverwrite) {
        process.exit(1);
      }
    }
  } else {
    mkdirp(cwd);
  }

  const options = /** @type {import('./types/internal').Options} */ await prompts([
    {
      type: 'select',
      name: 'template',
      message: 'Which app template would you like to use?',
      choices: TEMPLATES,
    },
  ]);

  const hash = args.commit ? `#${args.commit}` : '';
  const emitter = degit(`snowpackjs/astro/examples/${options.template}${hash}`, {
    cache: false,
    force: true,
    verbose: false,
  });

  // Copy
  try {
    // emitter.on('info', info => { console.log(info.message) });
    console.log(green(`>`) + gray(` Copying project files...`));
    await emitter.clone(cwd);
  } catch (err) {
    // degit is compiled, so the stacktrace is pretty noisy. Just report the message.
    console.error(red(err.message));
    process.exit(1);
  }

  // Post-process in parallel
  await Promise.all(
    POSTPROCESS_FILES.map(async (file) => {
      const fileLoc = path.join(cwd, file);

      switch (file) {
        case 'package.json': {
          const packageJSON = JSON.parse(await fs.promises.readFile(fileLoc, 'utf8'));
          delete packageJSON.snowpack; // delete snowpack config only needed in monorepo (can mess up projects)
          await fs.promises.writeFile(fileLoc, JSON.stringify(packageJSON, undefined, 2));
          break;
        }
      }
    })
  );

  console.log(bold(green('✔') + ' Done!'));

  console.log('\nNext steps:');
  let i = 1;

  const relative = path.relative(process.cwd(), cwd);
  if (relative !== '') {
    console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
  }

  console.log(`  ${i++}: ${bold(cyan('npm install'))} (or pnpm install, yarn, etc)`);
  console.log(`  ${i++}: ${bold(cyan('git init && git add -A && git commit -m "Initial commit"'))} (optional step)`);
  console.log(`  ${i++}: ${bold(cyan('npm start'))} (or pnpm, yarn, etc)`);

  console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
  console.log('\nStuck? Visit us at https://astro.build/chat\n');
}
