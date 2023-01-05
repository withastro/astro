import type { AstroGlobalPartial } from '../../@types/astro';
import { ASTRO_VERSION } from '../../core/constants.js';

/** Create the Astro.glob() runtime function. */
function createAstroGlobFn() {
	const globHandler = (importMetaGlobResult: Record<string, any>, globValue: () => any) => {
		let allEntries = [...Object.values(importMetaGlobResult)];
		if (allEntries.length === 0) {
			throw new Error(`Astro.glob(${JSON.stringify(globValue())}) - no matches found.`);
		}
		// Map over the `import()` promises, calling to load them.
		return Promise.all(allEntries.map((fn) => fn()));
	};
	// Cast the return type because the argument that the user sees (string) is different from the argument
	// that the runtime sees post-compiler (Record<string, Module>).
	return globHandler as unknown as AstroGlobalPartial['glob'];
}

// This is used to create the top-level Astro global; the one that you can use
// Inside of getStaticPaths.
// TODO: remove `_filePathname` and `_projectRootStr` from the compiler
export function createAstro(
	_filePathname: string,
	site: string | undefined,
	_projectRootStr: string
): AstroGlobalPartial {
	return {
		site: site ? new URL(site) : undefined,
		generator: `Astro v${ASTRO_VERSION}`,
		glob: createAstroGlobFn(),
	};
}
