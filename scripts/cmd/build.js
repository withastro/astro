import esbuild from 'esbuild';
import svelte from '../utils/svelte-plugin.js';
import del from 'del';
import { promises as fs } from 'fs';
import { dim, green, red, yellow } from 'kleur/colors';
import glob from 'tiny-glob';

/** @type {import('esbuild').BuildOptions} */
const defaultConfig = {
  bundle: true,
  minify: false,
  format: 'esm',
  platform: 'node',
  target: 'node14',
  sourcemap: 'inline',
  sourcesContent: false,
  plugins: [svelte()],
};

export default async function build(...args) {
  const config = Object.assign({}, defaultConfig);
  const isDev = args.slice(-1)[0] === 'IS_DEV';
  let entryPoints = [].concat(...(await Promise.all(args.map((pattern) => glob(pattern, { filesOnly: true, absolute: true })))));

  const { type = 'module', dependencies = {} } = await fs.readFile('./package.json').then((res) => JSON.parse(res.toString()));
  const format = type === 'module' ? 'esm' : 'cjs';
  const external = [...Object.keys(dependencies), 'source-map-support', 'source-map-support/register.js'];
  const outdir = 'dist';
  await clean(outdir);

  if (!isDev) {
    await esbuild.build({
      ...config,
      entryPoints,
      outdir,
      external,
      format,
    });
    return;
  }

  const builder = await esbuild.build({
    ...config,
    watch: {
      onRebuild(error, result) {
        const date = new Date().toISOString();
        if (error || (result && result.errors.length)) {
          console.error(dim(`[${date}] `) + red(error || result.errors.join('\n')));
        } else {
          if (result.warnings.length) {
            console.log(dim(`[${date}] `) + yellow('⚠ updated with warnings:\n' + result.warnings.join('\n')));
          }
          console.log(dim(`[${date}] `) + green('✔ updated'));
        }
      },
    },
    entryPoints,
    outdir,
    external,
    format,
  });

  process.on('beforeExit', () => {
    builder.stop?.();
  });
}

async function clean(outdir) {
  return del([`${outdir}/**`, `!${outdir}/**/*.d.ts`]);
}
