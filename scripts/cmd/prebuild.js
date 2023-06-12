import esbuild from 'esbuild';
import { red } from 'kleur/colors';
import glob from 'tiny-glob';
import fs from 'fs';
import path from 'path';
import { pathToFileURL, fileURLToPath } from 'url';

function escapeTemplateLiterals(str) {
	return str.replace(/\`/g, '\\`').replace(/\$\{/g, '\\${');
}

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
	let entryPoints = [].concat(
		...(await Promise.all(
			patterns.map((pattern) => glob(pattern, { filesOnly: true, absolute: true }))
		))
	);

	function getPrebuildURL(entryfilepath) {
		const entryURL = pathToFileURL(entryfilepath);
		const basename = path.basename(entryfilepath);
		const ext = path.extname(entryfilepath);
		const name = basename.slice(0, basename.indexOf(ext));
		const outname = `${name}.prebuilt${ext}`;
		const outURL = new URL('./' + outname, entryURL);
		return outURL;
	}

	async function prebuildFile(filepath) {
		let tscode = await fs.promises.readFile(filepath, 'utf-8');
		// If we're bundling a client directive, modify the code to match `packages/astro/src/core/client-directive/build.ts`.
		// If updating this code, make sure to also update that file.
		if (filepath.includes(`runtime${path.sep}client`)) {
			// `export default xxxDirective` is a convention used in the current client directives that we use
			// to make sure we bundle this right. We'll error below if this convention isn't followed.
			const newTscode = tscode.replace(
				/export default (.*?)Directive/,
				(_, name) =>
					`(self.Astro || (self.Astro = {})).${name} = ${name}Directive;window.dispatchEvent(new Event('astro:${name}'))`
			);
			if (newTscode === tscode) {
				console.error(
					red(
						`${filepath} doesn't follow the \`export default xxxDirective\` convention. The prebuilt output may be wrong. ` +
							`For more information, check out ${fileURLToPath(import.meta.url)}`
					)
				);
			}
			tscode = newTscode;
		}
		const esbuildresult = await esbuild.build({
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
		});
		const code = esbuildresult.outputFiles[0].text.trim();
		const rootURL = new URL('../../', import.meta.url);
		const rel = path.relative(fileURLToPath(rootURL), filepath);
		const mod = `/**
 * This file is prebuilt from ${rel}
 * Do not edit this directly, but instead edit that file and rerun the prebuild
 * to generate this file.
 */

export default \`${escapeTemplateLiterals(code)}\`;`;
		const url = getPrebuildURL(filepath);
		await fs.promises.writeFile(url, mod, 'utf-8');
	}

	await Promise.all(entryPoints.map(prebuildFile));
}
