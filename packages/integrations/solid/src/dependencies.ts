import type { AstroConfig } from 'astro';
import { fileURLToPath } from 'url';
import { crawlFrameworkPkgs } from 'vitefu';

export async function getSolidPkgsConfig(isBuild: boolean, astroConfig: AstroConfig) {
	return await crawlFrameworkPkgs({
		root: fileURLToPath(astroConfig.root),
		isBuild,
		viteUserConfig: astroConfig.vite,
		isFrameworkPkgByJson(pkgJson) {
			return containsSolidField(pkgJson.exports || {});
		},
	});
}

// Reference vite-plugin-solid heuristic
// https://github.com/solidjs/vite-plugin-solid/blob/5558486b0c63788e1275244256918f80294a8338/src/index.ts#L251-L259
// License: MIT (https://github.com/solidjs/vite-plugin-solid/blob/5558486b0c63788e1275244256918f80294a8338/package.json#L38)
function containsSolidField(fields: Record<string, any>) {
	const keys = Object.keys(fields);
	for (const key of keys) {
		if (key === 'solid') return true;
		if (typeof fields[key] === 'object' && fields[key] != null && containsSolidField(fields[key]))
			return true;
	}
	return false;
}
