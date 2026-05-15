import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
let cwdUrlStr;
const require2 = createRequire(import.meta.url);
async function importPlugin(p) {
	try {
		const importResult2 = await import(
			/* @vite-ignore */
			p
		);
		return importResult2.default;
	} catch {}
	cwdUrlStr ??= pathToFileURL(path.join(process.cwd(), 'package.json')).toString();
	const resolved = pathToFileURL(require2.resolve(p, { paths: [cwdUrlStr] })).toString();
	const importResult = await import(
		/* @vite-ignore */
		resolved
	);
	return importResult.default;
}
export { importPlugin };
