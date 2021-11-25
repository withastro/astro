import fs from 'fs';
import path from 'path';
import { bold, cyan, gray, green, red, yellow } from 'kleur/colors';
import fetch from 'node-fetch';
import prompts from 'prompts';
import degit from 'degit';
import yargs from 'yargs-parser';
import { FRAMEWORKS, COUNTER_COMPONENTS } from './frameworks.js';
import { TEMPLATES } from './templates.js';
import { createConfig } from './config.js';

// NOTE: In the v7.x version of npm, the default behavior of `npm init` was changed
// to no longer require `--` to pass args and instead pass `--` directly to us. This
// broke our arg parser, since `--` is a special kind of flag. Filtering for `--` here
// fixes the issue so that create-astro now works on all npm version.
const cleanArgv = process.argv.filter((arg) => arg !== '--');
const args = yargs(cleanArgv);
prompts.override(args);

export function mkdirp(dir: string) {
  try {
    fs.mkdirSync(dir, { recursive: true });
  } catch (e: any) {
    if (e.code === 'EEXIST') return;
    throw e;
  }
}

const { version } = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));

const POSTPROCESS_FILES = ['package.json', 'astro.config.mjs', 'CHANGELOG.md']; // some files need processing after copying.

export async function main() {
  console.log(`\n${bold('Welcome to Astro!')} ${gray(`(create-astro v${version})`)}`);
  console.log(`If you encounter a problem, visit ${cyan('https://github.com/withastro/astro/issues')} to search or file a new issue.\n`);

  console.log(`${green(`>`)} ${gray(`Prepare for liftoff.`)}`);
  console.log(`${green(`>`)} ${gray(`Gathering mission details...`)}`);

  const cwd = args['_'][2] || '.';
  if (fs.existsSync(cwd)) {
    if (fs.readdirSync(cwd).length > 0) {
      const response = await prompts({
        type: 'confirm',
        name: 'forceOverwrite',
        message: 'Directory not empty. Continue [force overwrite]?',
        initial: false,
      });
      if (!response.forceOverwrite) {
        process.exit(1);
      }
      mkdirp(cwd);
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

  if (!options.template) {
    process.exit(1);
  }

  const hash = args.commit ? `#${args.commit}` : '';

  const templateTarget = options.template.includes('/') ? options.template : `withastro/astro/examples/${options.template}#latest`;

  const emitter = degit(`${templateTarget}${hash}`, {
    cache: false,
    force: true,
    verbose: false,
  });

  const selectedTemplate = TEMPLATES.find((template) => template.value === options.template);
  let renderers: string[] = [];

  if (selectedTemplate?.renderers === true) {
    const result = /** @type {import('./types/internal').Options} */ await prompts([
      {
        type: 'multiselect',
        name: 'renderers',
        message: 'Which frameworks would you like to use?',
        choices: FRAMEWORKS,
      },
    ]);
    renderers = result.renderers;
  } else if (selectedTemplate?.renderers && Array.isArray(selectedTemplate.renderers) && selectedTemplate.renderers.length) {
    renderers = selectedTemplate.renderers;
    const titles = renderers.map((renderer) => FRAMEWORKS.find((item) => item.value === renderer)?.title).join(', ');
    console.log(`${green(`✔`)} ${bold(`Using template's default renderers`)} ${gray('›')} ${titles}`);
  }

  // Copy
  try {
    // emitter.on('info', info => { console.log(info.message) });
    console.log(`${green(`>`)} ${gray(`Copying project files...`)}`);
    await emitter.clone(cwd);
  } catch (err: any) {
    // degit is compiled, so the stacktrace is pretty noisy. Just report the message.
    console.error(red(err.message));

    // Warning for issue #655
    if (err.message === 'zlib: unexpected end of file') {
      console.log(yellow("This seems to be a cache related problem. Remove the folder '~/.degit/github/snowpackjs' to fix this error."));
      console.log(yellow('For more information check out this issue: https://github.com/withastro/astro/issues/655'));
    }

    // Helpful message when encountering the "could not find commit hash for ..." error
    if (err.code === 'MISSING_REF') {
      console.log(yellow("This seems to be an issue with degit. Please check if you have 'git' installed on your system, and install it if you don't have (https://git-scm.com)."));
      console.log(yellow("If you do have 'git' installed, please file a new issue here: https://github.com/withastro/astro/issues"));
    }
    process.exit(1);
  }

  // Post-process in parallel
  await Promise.all(
    POSTPROCESS_FILES.map(async (file) => {
      const fileLoc = path.resolve(path.join(cwd, file));

      switch (file) {
        case 'CHANGELOG.md': {
          if (fs.existsSync(fileLoc)) {
            await fs.promises.unlink(fileLoc);
          }
          break;
        }
        case 'astro.config.mjs': {
          if (selectedTemplate?.renderers !== true) {
            break;
          }
          await fs.promises.writeFile(fileLoc, createConfig({ renderers }));
          break;
        }
        case 'package.json': {
          const packageJSON = JSON.parse(await fs.promises.readFile(fileLoc, 'utf8'));
          delete packageJSON.snowpack; // delete snowpack config only needed in monorepo (can mess up projects)
          // Fetch latest versions of selected renderers
          const rendererEntries = (await Promise.all(
            ['astro', ...renderers].map((renderer: string) =>
              fetch(`https://registry.npmjs.org/${renderer}/latest`)
                .then((res: any) => res.json())
                .then((res: any) => [renderer, `^${res['version']}`])
            )
          )) as any;
          packageJSON.devDependencies = { ...(packageJSON.devDependencies ?? {}), ...Object.fromEntries(rendererEntries) };
          await fs.promises.writeFile(fileLoc, JSON.stringify(packageJSON, undefined, 2));
          break;
        }
      }
    })
  );

  // Inject framework components into starter template
  if (selectedTemplate?.value === 'starter') {
    let importStatements: string[] = [];
    let components: string[] = [];
    await Promise.all(
      renderers.map(async (renderer) => {
        const component = COUNTER_COMPONENTS[renderer as keyof typeof COUNTER_COMPONENTS];
        const componentName = path.basename(component.filename, path.extname(component.filename));
        const absFileLoc = path.resolve(cwd, component.filename);
        importStatements.push(`import ${componentName} from '${component.filename.replace(/^src/, '..')}';`);
        components.push(`<${componentName} client:visible />`);
        await fs.promises.writeFile(absFileLoc, component.content);
      })
    );

    const pageFileLoc = path.resolve(path.join(cwd, 'src', 'pages', 'index.astro'));
    const content = (await fs.promises.readFile(pageFileLoc)).toString();
    const newContent = content
      .replace(/^(\s*)\/\* ASTRO\:COMPONENT_IMPORTS \*\//gm, (_, indent) => {
        return indent + importStatements.join('\n');
      })
      .replace(/^(\s*)<!-- ASTRO:COMPONENT_MARKUP -->/gm, (_, indent) => {
        return components.map((ln) => indent + ln).join('\n');
      });
    await fs.promises.writeFile(pageFileLoc, newContent);
  }

  console.log(bold(green('✔') + ' Done!'));

  console.log('\nNext steps:');
  let i = 1;

  const relative = path.relative(process.cwd(), cwd);
  if (relative !== '') {
    console.log(`  ${i++}: ${bold(cyan(`cd ${relative}`))}`);
  }

  console.log(`  ${i++}: ${bold(cyan('npm install'))} (or pnpm install, yarn, etc)`);
  console.log(`  ${i++}: ${bold(cyan('git init && git add -A && git commit -m "Initial commit"'))} (optional step)`);
  console.log(`  ${i++}: ${bold(cyan('npm run dev'))} (or pnpm, yarn, etc)`);

  console.log(`\nTo close the dev server, hit ${bold(cyan('Ctrl-C'))}`);
  console.log(`\nStuck? Visit us at ${cyan('https://astro.build/chat')}\n`);
}
