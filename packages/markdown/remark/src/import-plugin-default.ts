// This file should be imported as `#import-plugin`

import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type * as unified from 'unified';

let cwdUrlStr: string | undefined;
const require = createRequire(import.meta.url);

// In non-browser environments, we can try to resolve from the filesystem too
export async function importPlugin(p: string): Promise<unified.Plugin> {
	// Try import from this package first
	try {
		const importResult = await import(/* @vite-ignore */ p);
		return importResult.default;
	} catch {}

	// Try import from user project
	cwdUrlStr ??= pathToFileURL(path.join(process.cwd(), 'package.json')).toString();
	const resolved = pathToFileURL(require.resolve(p, { paths: [cwdUrlStr] })).toString();
	const importResult = await import(/* @vite-ignore */ resolved);
	return importResult.default;
}
