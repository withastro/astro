import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import esbuild from 'esbuild';
import { red } from 'kleur/colors';
import { glob } from 'tinyglobby';
import crypto from 'node:crypto';

function escapeTemplateLiterals(str) {
	return str.replace(/\`/g, '\\`').replace(/\$\{/g, '\\${');
}

const ASTRO_ISLAND_STYLE_REGEX = /'([^']*)'/;

export default async function prebuild(...args) {
	let buildToString = args.indexOf('--to-string');
	if (buildToString !== -1) {
		args.splice(buildToString, 1);
		buildToString = true;
	}
	let minify = true;
	let minifyIdx = args.indexOf('--no-minify');
	if (minifyIdx !== -1) {
		minify = false;
		args.splice(minifyIdx, 1);
	}

	let patterns = args;
	// NOTE: absolute paths returned are forward slashes on windows
	let entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { onlyFiles: true, absolute: true })),
		)),
	);

	function getPrebuildURL(entryfilepath, dev = false) {
		const entryURL = pathToFileURL(entryfilepath);
		const basename = path.basename(entryfilepath);
		const ext = path.extname(entryfilepath);
		const name = basename.slice(0, basename.indexOf(ext));
		const outname = dev ? `${name}.prebuilt-dev${ext}` : `${name}.prebuilt${ext}`;
		const outURL = new URL('./' + outname, entryURL);
		return outURL;
	}

	const hashes = new Map();

	async function prebuildFile(filepath) {
		let tscode = await fs.promises.readFile(filepath, 'utf-8');
		// If we're bundling a client directive, modify the code to match `packages/astro/src/core/client-directive/build.ts`.
		// If updating this code, make sure to also update that file.
		if (filepath.includes('runtime/client')) {
			// `export default xxxDirective` is a convention used in the current client directives that we use
			// to make sure we bundle this right. We'll error below if this convention isn't followed.
			const newTscode = tscode.replace(
				/export default (.*?)Directive/,
				(_, name) =>
					`(self.Astro || (self.Astro = {})).${name} = ${name}Directive;window.dispatchEvent(new Event('astro:${name}'))`,
			);
			if (newTscode === tscode) {
				console.error(
					red(
						`${filepath} doesn't follow the \`export default xxxDirective\` convention. The prebuilt output may be wrong. ` +
							`For more information, check out ${fileURLToPath(import.meta.url)}`,
					),
				);
			}
			tscode = newTscode;
		}

		const esbuildOptions = {
			stdin: {
				contents: tscode,
				resolveDir: path.dirname(filepath),
				loader: 'ts',
				sourcefile: filepath,
			},
			format: 'iife',
			target: ['es2018'],
			minify,
			bundle: true,
			write: false,
		};

		const results = await Promise.all(
			[
				{
					build: await esbuild.build(esbuildOptions),
					dev: false,
				},
				filepath.includes('astro-island')
					? {
							build: await esbuild.build({
								...esbuildOptions,
								define: { 'process.env.NODE_ENV': '"development"' },
							}),
							dev: true,
						}
					: undefined,
			].filter((entry) => entry),
		);

		for (const result of results) {
			const code = result.build.outputFiles[0].text.trim();
			const rootURL = new URL('../../', import.meta.url);
			const rel = path.relative(fileURLToPath(rootURL), filepath);
			const generatedCode = escapeTemplateLiterals(code);
			const mod = `/**
 * This file is prebuilt from ${rel}
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default \`${generatedCode}\`;`;
			const url = getPrebuildURL(filepath, result.dev);
			await fs.promises.writeFile(url, mod, 'utf-8');
			const hash = crypto.createHash('sha256').update(code).digest('base64');
			const basename = path.basename(filepath);
			hashes.set(basename.slice(0, basename.indexOf('.')), hash);
		}
	}
	for (const entrypoint of entryPoints) {
		await prebuildFile(entrypoint);
	}

	const fileContent = await fs.promises.readFile(
		new URL('../../packages/astro/src/runtime/server/astro-island-styles.ts', import.meta.url),
		'utf-8',
	);
	const styleContent = fileContent.match(ASTRO_ISLAND_STYLE_REGEX)[1];
	hashes.set(
		'astro-island-styles',
		crypto.createHash('sha256').update(styleContent).digest('base64'),
	);

	const entries = JSON.stringify(Object.fromEntries(hashes.entries()), null, 2);
	const content = `// This file is code-generated, please don't change it manually
export const ASTRO_ISLAND_HASHES = ${entries};`;
	await fs.promises.writeFile(
		path.join(
			fileURLToPath(import.meta.url),
			'../../../packages/astro/src/core',
			'astro-islands-hashes.ts',
		),
		content,
		'utf-8',
	);
}
