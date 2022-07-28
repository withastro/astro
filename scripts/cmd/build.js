import esbuild from 'esbuild';
import svelte from '../utils/svelte-plugin.js';
import del from 'del';
import { promises as fs } from 'fs';
import { dim, green, red, yellow } from 'kleur/colors';
import glob from 'tiny-glob';
import prebuild from './prebuild.js';

/** @type {import('esbuild').BuildOptions} */
const defaultConfig = {
	minify: false,
	format: 'esm',
	platform: 'node',
	target: 'node14',
	sourcemap: false,
	sourcesContent: false,
};

const dt = new Intl.DateTimeFormat('en-us', {
	hour: '2-digit',
	minute: '2-digit',
});

function getPrebuilds(isDev, args) {
	let prebuilds = [];
	while (args.includes('--prebuild')) {
		let idx = args.indexOf('--prebuild');
		prebuilds.push(args[idx + 1]);
		args.splice(idx, 2);
	}
	if (prebuilds.length && isDev) {
		prebuilds.unshift('--no-minify');
	}
	return prebuilds;
}

export default async function build(...args) {
	const config = Object.assign({}, defaultConfig);
	const isDev = args.slice(-1)[0] === 'IS_DEV';
	const prebuilds = getPrebuilds(isDev, args);
	const patterns = args
		.filter((f) => !!f) // remove empty args
		.map((f) => f.replace(/^'/, '').replace(/'$/, '')); // Needed for Windows: glob strings contain surrounding string chars??? remove these
	let entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true }))
		))
	);

	const noClean = args.includes('--no-clean-dist');
	const forceCJS = args.includes('--force-cjs');

	const {
		type = 'module',
		version,
		dependencies = {},
	} = await fs.readFile('./package.json').then((res) => JSON.parse(res.toString()));
	// expose PACKAGE_VERSION on process.env for CLI utils
	config.define = { 'process.env.PACKAGE_VERSION': JSON.stringify(version) };
	const format = type === 'module' && !forceCJS ? 'esm' : 'cjs';

	const outdir = 'dist';

	if (!noClean) {
		await clean(outdir);
	}

	if (!isDev) {
		await esbuild.build({
			...config,
			bundle: false,
			entryPoints,
			outdir,
			outExtension: forceCJS ? { '.js': '.cjs' } : {},
			format,
		});
		return;
	}

	const builder = await esbuild.build({
		...config,
		watch: {
			onRebuild(error, result) {
				if (prebuilds.length) {
					prebuild(...prebuilds);
				}
				const date = dt.format(new Date());
				if (error || (result && result.errors.length)) {
					console.error(dim(`[${date}] `) + red(error || result.errors.join('\n')));
				} else {
					if (result.warnings.length) {
						console.log(
							dim(`[${date}] `) + yellow('⚠ updated with warnings:\n' + result.warnings.join('\n'))
						);
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
