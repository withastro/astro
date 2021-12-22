// @ts-nocheck
import { compile } from 'svelte/compiler';
import { relative, isAbsolute, join, dirname } from 'path';
import { promises as fs } from 'fs';

const convertMessage = ({ message, start, end, filename, frame }) => ({
	text: message,
	location: start &&
		end && {
			file: filename,
			line: start.line,
			column: start.column,
			length: start.line === end.line ? end.column - start.column : 0,
			lineText: frame,
		},
});

const handleLoad = async (args, generate, { isDev }) => {
	const { path } = args;
	const source = await fs.readFile(path, 'utf8');
	const filename = relative(process.cwd(), path);

	try {
		let compileOptions = { dev: isDev, css: false, generate, hydratable: true };

		let { js, warnings } = compile(source, { ...compileOptions, filename });
		let contents = js.code + `\n//# sourceMappingURL=` + js.map.toUrl();

		return { loader: 'js', contents, resolveDir: dirname(path), warnings: warnings.map((w) => convertMessage(w)) };
	} catch (e) {
		return { errors: [convertMessage(e)] };
	}
};

export default function sveltePlugin({ isDev = false }) {
	return {
		name: 'svelte-esbuild',
		setup(build) {
			build.onResolve({ filter: /\.svelte$/ }, (args) => {
				let path = args.path.replace(/\.(?:client|server)/, '');
				path = isAbsolute(path) ? path : join(args.resolveDir, path);

				if (/\.client\.svelte$/.test(args.path)) {
					return {
						path,
						namespace: 'svelte:client',
					};
				}

				if (/\.server\.svelte$/.test(args.path)) {
					return {
						path,
						namespace: 'svelte:server',
					};
				}
			});
			build.onLoad({ filter: /.*/, namespace: 'svelte:client' }, (args) => handleLoad(args, 'dom', { isDev }));
			build.onLoad({ filter: /.*/, namespace: 'svelte:server' }, (args) => handleLoad(args, 'ssr', { isDev }));
		},
	};
}
