import { existsSync, watch as fsWatch } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import colors from 'piccolore';
import { rolldown, watch } from 'rolldown';
import { transform } from 'rolldown/utils';
import { glob } from 'tinyglobby';
import prebuild from './prebuild.js';

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

/**
 * Lowest common ancestor directory of the entry points, used to mirror the
 * source layout in the output directory.
 */
function getOutbase(entryPoints) {
	let common = path.dirname(entryPoints[0]).split(path.sep);
	for (const entryPoint of entryPoints) {
		const dir = path.dirname(entryPoint).split(path.sep);
		let i = 0;
		while (i < common.length && i < dir.length && common[i] === dir[i]) {
			i++;
		}
		common = common.slice(0, i);
	}
	return common.join(path.sep) || path.sep;
}

function getEntryPoints(patterns) {
	return Promise.all(
		patterns.map((pattern) =>
			glob(pattern, { filesOnly: true, expandDirectories: false, absolute: true }),
		),
	).then((results) => [].concat(...results).map((entryPoint) => path.normalize(entryPoint)));
}

function getLang(filepath) {
	if (filepath.endsWith('.tsx')) return 'tsx';
	if (filepath.endsWith('.jsx')) return 'jsx';
	if (filepath.endsWith('.ts') || filepath.endsWith('.mts') || filepath.endsWith('.cts')) {
		return 'ts';
	}
	return 'js';
}

/**
 * Transpile a single file, leaving all imports untouched. This is used to publish
 * packages that keep their source layout (including non-JS imports like `.astro`).
 */
async function transpileFile(entryPoint, { outdir, outbase, isDev, define }) {
	const code = await fs.readFile(entryPoint, 'utf-8');
	const result = await transform(entryPoint, code, {
		lang: getLang(entryPoint),
		target: 'node20',
		define,
		sourcemap: isDev,
	});
	if (result.errors.length > 0) {
		throw result.errors[0];
	}

	const relative = path
		.relative(outbase, entryPoint)
		.replace(/\.(ts|mts|cts|tsx|jsx|js|mjs|cjs)$/, '.js');
	const outputPath = path.join(outdir, relative);
	await fs.mkdir(path.dirname(outputPath), { recursive: true });

	let output = result.code;
	if (isDev && result.map) {
		const mapName = `${path.basename(outputPath)}.map`;
		await fs.writeFile(`${outputPath}.map`, JSON.stringify(result.map));
		output += `\n//# sourceMappingURL=${mapName}\n`;
	}
	await fs.writeFile(outputPath, output);
}

export default async function build(...args) {
	const isDev = args.slice(-1)[0] === 'IS_DEV';
	const prebuilds = getPrebuilds(isDev, args);
	const patterns = args
		.filter((f) => !!f) // remove empty args
		.filter((f) => !f.startsWith('--')) // remove flags
		.map((f) => f.replace(/^'/, '').replace(/'$/, '')); // Needed for Windows: glob strings contain surrounding string chars??? remove these
	const entryPoints = await getEntryPoints(patterns);

	const noClean = args.includes('--no-clean-dist');
	const cleanDts = args.includes('--clean-dts');
	const bundle = args.includes('--bundle');
	const forceCJS = args.includes('--force-cjs');

	const { type = 'module', dependencies = {} } = await readPackageJSON('./package.json');

	const define = {};
	for (const [key, value] of await getDefinedEntries()) {
		define[`process.env.${key}`] = JSON.stringify(value);
	}
	const format = type === 'module' && !forceCJS ? 'esm' : 'cjs';

	const outdir = 'dist';

	if (!noClean) {
		await clean(outdir, cleanDts);
	}

	// `--bundle` and `--force-cjs` both need a real bundle pass. `--force-cjs`
	// additionally converts ESM to CJS, which the per-file transform can't do.
	if (bundle || forceCJS) {
		const inputOptions = {
			input: entryPoints,
			cwd: process.cwd(),
			platform: 'node',
			external: bundle ? Object.keys(dependencies) : () => true,
			treeshake: false,
			transform: {
				target: 'node20',
				define,
			},
		};
		const outputOptions = {
			dir: outdir,
			format,
			sourcemap: isDev,
			entryFileNames: forceCJS ? '[name].cjs' : '[name].js',
		};

		if (!isDev) {
			const builder = await rolldown(inputOptions);
			try {
				await builder.write(outputOptions);
			} finally {
				await builder.close();
			}
			return;
		}

		const watcher = watch({ ...inputOptions, output: outputOptions });
		watcher.on('event', async (event) => {
			if (event.code === 'ERROR') {
				logError(event.error);
				return;
			}
			if (event.code === 'END') {
				if (prebuilds.length) {
					await prebuild(...prebuilds);
				}
				logUpdated();
			}
		});
		process.on('beforeExit', () => {
			void watcher.close();
		});
		return;
	}

	const outbase = getOutbase(entryPoints);
	const transpile = (files) =>
		Promise.all(
			files.map((entryPoint) => transpileFile(entryPoint, { outdir, outbase, isDev, define })),
		);

	if (!isDev) {
		await transpile(entryPoints);
		return;
	}

	const run = async (files) => {
		try {
			await transpile(files);
			if (prebuilds.length) {
				await prebuild(...prebuilds);
			}
			logUpdated();
		} catch (error) {
			logError(error);
		}
	};

	await run(entryPoints);

	let timer;
	const pending = new Set();
	const schedule = (file) => {
		pending.add(file);
		clearTimeout(timer);
		timer = setTimeout(async () => {
			const files = [...pending].filter((file) => existsSync(file));
			pending.clear();
			await run(files);
		}, 50);
	};

	const watcher = fsWatch(process.cwd(), { recursive: true }, (_event, filename) => {
		if (!filename) return;
		const normalized = filename.split(path.sep).join('/');
		if (normalized.startsWith(`${outdir}/`) || normalized.startsWith('node_modules/')) return;
		if (!patterns.some((pattern) => path.matchesGlob(normalized, pattern))) return;
		schedule(path.resolve(filename));
	});

	process.on('beforeExit', () => {
		watcher.close();
	});
}

function logUpdated() {
	console.info(colors.dim(`[${dt.format(new Date())}] `) + colors.green('√ updated'));
}

function logError(error) {
	console.error(
		colors.dim(`[${dt.format(new Date())}] `) +
			colors.red(error instanceof Error ? error.message : String(error)),
	);
}

async function clean(outdir, cleanDts) {
	const files = await glob('**', {
		cwd: outdir,
		dot: true,
		filesOnly: true,
		ignore: cleanDts ? undefined : ['**/*.d.ts'],
		absolute: true,
	});
	await Promise.all(files.map((file) => fs.rm(file, { force: true })));
}

/**
 * Contextual `define` values to statically replace in the built JS output.
 * Available to all packages, but mostly useful for CLIs like `create-astro`.
 */
async function getDefinedEntries() {
	const [PACKAGE_VERSION, ASTRO_VERSION, ASTRO_CHECK_VERSION, TYPESCRIPT_VERSION] =
		await Promise.all([
			getInternalPackageVersion('./package.json'),
			getInternalPackageVersion(new URL('../../packages/astro/package.json', import.meta.url)),
			getWorkspacePackageVersion('@astrojs/check'),
			getWorkspacePackageVersion('typescript'),
		]);
	const define = {
		/** The current version (at the time of building) for the current package, such as `astro` or `@astrojs/sitemap` */
		PACKAGE_VERSION,
		/** The current version (at the time of building) for `astro` */
		ASTRO_VERSION,
		/** The current version (at the time of building) for `@astrojs/check` */
		ASTRO_CHECK_VERSION,
		/** The current version (at the time of building) for `typescript` */
		TYPESCRIPT_VERSION,
	};
	for (const [key, value] of Object.entries(define)) {
		if (value === undefined) {
			delete define[key];
		}
	}
	return Object.entries(define);
}

async function readPackageJSON(path) {
	return await fs.readFile(path, { encoding: 'utf8' }).then((res) => JSON.parse(res));
}

async function getInternalPackageVersion(path) {
	return readPackageJSON(path).then((res) => res.version);
}

async function getWorkspacePackageVersion(packageName) {
	const { dependencies, devDependencies } = await readPackageJSON(
		new URL('../../package.json', import.meta.url),
	);
	const deps = { ...dependencies, ...devDependencies };
	const version = deps[packageName];
	if (!version) {
		throw new Error(
			`Unable to resolve "${packageName}". Is it a dependency of the workspace root?`,
		);
	}
	return version.replace(/^\D+/, '');
}
