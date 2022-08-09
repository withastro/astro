import type { AstroGlobalPartial } from '../../@types/astro';

// process.env.PACKAGE_VERSION is injected when we build and publish the astro package.
const ASTRO_VERSION = process.env.PACKAGE_VERSION ?? 'development';

/** Create the Astro.fetchContent() runtime function. */
function createDeprecatedFetchContentFn() {
	return () => {
		throw new Error('Deprecated: Astro.fetchContent() has been replaced with Astro.glob().');
	};
}

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
export function createAstro(
	filePathname: string,
	_site: string | undefined,
	projectRootStr: string
): AstroGlobalPartial {
	const site = _site ? new URL(_site) : undefined;
	const referenceURL = new URL(filePathname, `http://localhost`);
	const projectRoot = new URL(projectRootStr);
	return {
		site,
		generator: `Astro v${ASTRO_VERSION}`,
		fetchContent: createDeprecatedFetchContentFn(),
		glob: createAstroGlobFn(),
		// INVESTIGATE is there a use-case for multi args?
		resolve(...segments: string[]) {
			let resolved = segments.reduce((u, segment) => new URL(segment, u), referenceURL).pathname;
			// When inside of project root, remove the leading path so you are
			// left with only `/src/images/tower.png`
			if (resolved.startsWith(projectRoot.pathname)) {
				resolved = '/' + resolved.slice(projectRoot.pathname.length);
			}
			return resolved;
		},
	};
}
