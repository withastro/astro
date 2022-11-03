import { fileURLToPath } from 'url';
import { crawlFrameworkPkgs } from 'vitefu';

export async function getSolidPkgsConfig(root: URL, isBuild: boolean) {
	return await crawlFrameworkPkgs({
		root: fileURLToPath(root),
		isBuild,
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
	for (let i = 0; i < keys.length; i++) {
		const key = keys[i];
		if (key === 'solid') return true;
		if (typeof fields[key] === 'object' && fields[key] != null && containsSolidField(fields[key]))
			return true;
	}
	return false;
}
