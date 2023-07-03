import { doWork } from '@altano/tiny-async-pool';
import type { AstroConfig } from 'astro';
import CachePolicy from 'http-cache-semantics';
import { bgGreen, black, cyan, dim, green } from 'kleur/colors';
import fs from 'node:fs/promises';
import OS from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SSRImageService, TransformOptions } from '../loaders/index.js';
import { debug, info, warn, type LoggerLevel } from '../utils/logger.js';
import { isRemoteImage, prependForwardSlash } from '../utils/paths.js';
import { ImageCache } from './cache.js';

async function loadLocalImage(src: string | URL) {
	try {
		const data = await fs.readFile(src);

		// Vite's file hash will change if the file is changed at all,
		// we can safely cache local images here.
		const timeToLive = new Date();
		timeToLive.setFullYear(timeToLive.getFullYear() + 1);

		return {
			data,
			expires: timeToLive.getTime(),
		};
	} catch {
		return undefined;
	}
}

function webToCachePolicyRequest({ url, method, headers: _headers }: Request): CachePolicy.Request {
	let headers: CachePolicy.Headers = {};
	// Be defensive here due to a cookie header bug in node@18.14.1 + undici
	try {
		headers = Object.fromEntries(_headers.entries());
	} catch {}
	return {
		method,
		url,
		headers,
	};
}

function webToCachePolicyResponse({ status, headers: _headers }: Response): CachePolicy.Response {
	let headers: CachePolicy.Headers = {};
	// Be defensive here due to a cookie header bug in node@18.14.1 + undici
	try {
		headers = Object.fromEntries(_headers.entries());
	} catch {}
	return {
		status,
		headers,
	};
}

async function loadRemoteImage(src: string) {
	try {
		if (src.startsWith('//')) {
			src = `https:${src}`;
		}

		const req = new Request(src);
		const res = await fetch(req);

		if (!res.ok) {
			return undefined;
		}

		// calculate an expiration date based on the response's TTL
		const policy = new CachePolicy(webToCachePolicyRequest(req), webToCachePolicyResponse(res));
		const expires = policy.storable() ? policy.timeToLive() : 0;

		return {
			data: Buffer.from(await res.arrayBuffer()),
			expires: Date.now() + expires,
		};
	} catch (err: unknown) {
		console.error(err);
		return undefined;
	}
}

function getTimeStat(timeStart: number, timeEnd: number) {
	const buildTime = timeEnd - timeStart;
	return buildTime < 750 ? `${Math.round(buildTime)}ms` : `${(buildTime / 1000).toFixed(2)}s`;
}

export interface SSGBuildParams {
	loader: SSRImageService;
	staticImages: Map<string, Map<string, TransformOptions>>;
	config: AstroConfig;
	outDir: URL;
	logLevel: LoggerLevel;
	cacheDir?: URL;
}

export async function ssgBuild({
	loader,
	staticImages,
	config,
	outDir,
	logLevel,
	cacheDir,
}: SSGBuildParams) {
	let cache: ImageCache | undefined = undefined;

	if (cacheDir) {
		cache = new ImageCache(cacheDir, logLevel);
		await cache.init();
	}

	const timer = performance.now();
	const cpuCount = OS.cpus().length;

	info({
		level: logLevel,
		prefix: false,
		message: `${bgGreen(
			black(
				` optimizing ${staticImages.size} image${
					staticImages.size > 1 ? 's' : ''
				} in batches of ${cpuCount} `
			)
		)}`,
	});

	async function processStaticImage([src, transformsMap]: [
		string,
		Map<string, TransformOptions>
	]): Promise<void> {
		let inputFile: string | undefined = undefined;
		let inputBuffer: Buffer | undefined = undefined;

		// tracks the cache duration for the original source image
		let expires = 0;

		// Strip leading assetsPrefix or base added by addStaticImage
		if (config.build.assetsPrefix) {
			if (src.startsWith(config.build.assetsPrefix)) {
				src = prependForwardSlash(src.slice(config.build.assetsPrefix.length));
			}
		} else if (config.base) {
			if (src.startsWith(config.base)) {
				src = prependForwardSlash(src.slice(config.base.length));
			}
		}

		if (isRemoteImage(src)) {
			// try to load the remote image
			const res = await loadRemoteImage(src);

			inputBuffer = res?.data;
			expires = res?.expires || 0;
		} else {
			const inputFileURL = new URL(`.${src}`, outDir);
			inputFile = fileURLToPath(inputFileURL);

			const res = await loadLocalImage(inputFile);
			inputBuffer = res?.data;
			expires = res?.expires || 0;
		}

		if (!inputBuffer) {
			warn({ level: logLevel, message: `"${src}" image could not be fetched` });
			return;
		}

		const transforms = Array.from(transformsMap.entries());

		debug({ level: logLevel, prefix: false, message: `${green('▶')} transforming ${src}` });
		let timeStart = performance.now();

		// process each transformed version
		for (const [filename, transform] of transforms) {
			timeStart = performance.now();
			let outputFile: string;
			let outputFileURL: URL;

			if (isRemoteImage(src)) {
				outputFileURL = new URL(
					path.join(`./${config.build.assets}`, path.basename(filename)),
					outDir
				);
				outputFile = fileURLToPath(outputFileURL);
			} else {
				outputFileURL = new URL(path.join(`./${config.build.assets}`, filename), outDir);
				outputFile = fileURLToPath(outputFileURL);
			}

			const pathRelative = outputFile.replace(fileURLToPath(outDir), '');

			let data: Buffer | undefined;

			// try to load the transformed image from cache, if available
			if (cache?.has(pathRelative)) {
				data = await cache.get(pathRelative);
			}

			// a valid cache file wasn't found, transform the image and cache it
			if (!data) {
				const transformed = await loader.transform(inputBuffer, transform);
				data = transformed.data;

				// cache the image, if available
				if (cache) {
					await cache.set(pathRelative, data, { expires });
				}
			}

			const outputFolder = new URL('./', outputFileURL);
			await fs.mkdir(outputFolder, { recursive: true });
			await fs.writeFile(outputFile, data);

			const timeEnd = performance.now();
			const timeChange = getTimeStat(timeStart, timeEnd);
			const timeIncrease = `(+${timeChange})`;

			debug({
				level: logLevel,
				prefix: false,
				message: `  ${cyan('created')} ${dim(pathRelative)} ${dim(timeIncrease)}`,
			});
		}
	}

	// transform each original image file in batches
	await doWork(cpuCount, staticImages, processStaticImage);

	// saves the cache's JSON manifest to file
	if (cache) {
		await cache.finalize();
	}

	info({
		level: logLevel,
		prefix: false,
		message: dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`),
	});
}
