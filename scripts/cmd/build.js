import esbuild from 'esbuild';
import svelte from '../utils/svelte-plugin.js';
import del from 'del';
import { promises as fs } from 'fs';
import { dim, green, red, yellow } from 'kleur/colors';
import glob from 'tiny-glob';

/** @type {import('esbuild').BuildOptions} */
const defaultConfig = {
	minify: false,
	format: 'esm',
	platform: 'node',
	target: 'node14',
	sourcemap: 'inline',
	sourcesContent: false,
};

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

export default async function build(...args) {
	const config = Object.assign({}, defaultConfig);
	const isDev = args.slice(-1)[0] === 'IS_DEV';
	const patterns = args
		.filter((f) => !!f) // remove empty args
		.map((f) => f.replace(/^'/, '').replace(/'$/, '')); // Needed for Windows: glob strings contain surrounding string chars??? remove these
	let entryPoints = [].concat(...(await Promise.all(patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true })))));

	const { type = 'module', version, dependencies = {} } = await fs.readFile('./package.json').then((res) => JSON.parse(res.toString()));
	// expose PACKAGE_VERSION on process.env for CLI utils
	config.define = { 'process.env.PACKAGE_VERSION': JSON.stringify(version) };
	const format = type === 'module' ? 'esm' : 'cjs';
	const outdir = 'dist';
	await clean(outdir);

	if (!isDev) {
		await esbuild.build({
			...config,
			sourcemap: false,
			bundle: false,
			entryPoints,
			outdir,
			format,
		});
		return;
	}

	const builder = await esbuild.build({
		...config,
		watch: {
			onRebuild(error, result) {
				const date = dt.format(new Date());
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
		format,
		plugins: [svelte({ isDev })],
	});

	process.on('beforeExit', () => {
		builder.stop && builder.stop();
	});
}

async function clean(outdir) {
	return del([`${outdir}/**`, `!${outdir}/**/*.d.ts`]);
}
