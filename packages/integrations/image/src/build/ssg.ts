import type { AstroConfig } from 'astro';
import { bgGreen, black, cyan, dim, green } from 'kleur/colors';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SSRImageService, TransformOptions } from '../loaders/index.js';
import { loadLocalImage, loadRemoteImage } from '../utils/images.js';
import { debug, info, LoggerLevel, warn } from '../utils/logger.js';
import { isRemoteImage } from '../utils/paths.js';

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
}

export async function ssgBuild({ loader, staticImages, config, outDir, logLevel }: SSGBuildParams) {
	const timer = performance.now();

	info({
		level: logLevel,
		prefix: false,
		message: `${bgGreen(
			black(` optimizing ${staticImages.size} image${staticImages.size > 1 ? 's' : ''} `)
		)}`,
	});

	const inputFiles = new Set<string>();

	// process transforms one original image file at a time
	for (let [src, transformsMap] of staticImages) {
		let inputFile: string | undefined = undefined;
		let inputBuffer: Buffer | undefined = undefined;

		// Vite will prefix a hashed image with the base path, we need to strip this
		// off to find the actual file relative to /dist
		if (config.base && src.startsWith(config.base)) {
			src = src.substring(config.base.length - 1);
		}

		if (isRemoteImage(src)) {
			// try to load the remote image
			inputBuffer = await loadRemoteImage(src);
		} else {
			const inputFileURL = new URL(`.${src}`, outDir);
			inputFile = fileURLToPath(inputFileURL);
			inputBuffer = await loadLocalImage(inputFile);

			// track the local file used so the original can be copied over
			inputFiles.add(inputFile);
		}

		if (!inputBuffer) {
			// eslint-disable-next-line no-console
			warn({ level: logLevel, message: `"${src}" image could not be fetched` });
			continue;
		}

		const transforms = Array.from(transformsMap.entries());

		debug({ level: logLevel, prefix: false, message: `${green('▶')} ${src}` });
		let timeStart = performance.now();

		// process each transformed versiono of the
		for (const [filename, transform] of transforms) {
			timeStart = performance.now();
			let outputFile: string;

			if (isRemoteImage(src)) {
				const outputFileURL = new URL(path.join('./', path.basename(filename)), outDir);
				outputFile = fileURLToPath(outputFileURL);
			} else {
				const outputFileURL = new URL(path.join('./', filename), outDir);
				outputFile = fileURLToPath(outputFileURL);
			}

			const { data } = await loader.transform(inputBuffer, transform);

			await fs.writeFile(outputFile, data);

			const timeEnd = performance.now();
			const timeChange = getTimeStat(timeStart, timeEnd);
			const timeIncrease = `(+${timeChange})`;
			const pathRelative = outputFile.replace(fileURLToPath(outDir), '');
			debug({
				level: logLevel,
				prefix: false,
				message: `  ${cyan('└─')} ${dim(pathRelative)} ${dim(timeIncrease)}`,
			});
		}
	}

	info({
		level: logLevel,
		prefix: false,
		message: dim(`Completed in ${getTimeStat(timer, performance.now())}.\n`),
	});
}
