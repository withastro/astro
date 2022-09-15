import cacache from 'cacache';
import findCacheDir from 'find-cache-dir';

const pkgVersion = process.env.npm_package_version ?? 'unknown';

function getCacheDir(): string {
	const cachePath = findCacheDir({ name: `@astrojs/fs/${pkgVersion}` });
	if (cachePath == null) {
		throw new Error(`Could not locate cache`);
	}
	return cachePath;
}

export const Cache = {
	get: cacache.get.bind(cacache, getCacheDir()),
	put: cacache.put.bind(cacache, getCacheDir()),
	clear: cacache.rm.all.bind(cacache.rm, getCacheDir()),
};
