import esbuild from 'esbuild';
import del from 'del';
import { promises as fs } from 'fs';
import { dim, green, red, yellow } from 'kleur/colors';
import glob from 'tiny-glob';

/** @type {import('esbuild').BuildOptions} */
const config = {
  bundle: true,
  minify: true,
  sourcemap: 'inline',
  format: 'esm',
  platform: 'node',
  target: 'node14',
};

export default async function build(pattern, ...args) {
  const isDev = args.pop() === 'IS_DEV';
  const entryPoints = await glob(pattern, { filesOnly: true, absolute: true });
  const { type = 'module', dependencies = {} } = await fs.readFile('./package.json').then((res) => JSON.parse(res.toString()));
  const format = type === 'module' ? 'esm' : 'cjs';
  const external = Object.keys(dependencies);
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
  return del(`!${outdir}/**/*.d.ts`);
}
