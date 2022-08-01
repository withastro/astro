import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { OUTPUT_DIR } from '../constants.js';
import type { SSRImageService, TransformOptions } from '../loaders/index.js';
import { isRemoteImage, loadLocalImage, loadRemoteImage } from '../utils/images.js';
import { ensureDir } from '../utils/paths.js';

export interface SSGBuildParams {
	loader: SSRImageService;
	staticImages: Map<string, Map<string, TransformOptions>>;
	srcDir: URL;
	outDir: URL;
}

export async function ssgBuild({ loader, staticImages, srcDir, outDir }: SSGBuildParams) {
	const inputFiles = new Set<string>();

	// process transforms one original image file at a time
	for await (const [src, transformsMap] of staticImages) {
		let inputFile: string | undefined = undefined;
		let inputBuffer: Buffer | undefined = undefined;

		if (isRemoteImage(src)) {
			// try to load the remote image
			inputBuffer = await loadRemoteImage(src);
		} else {
			const inputFileURL = new URL(`.${src}`, srcDir);
			inputFile = fileURLToPath(inputFileURL);
			inputBuffer = await loadLocalImage(inputFile);

			// track the local file used so the original can be copied over
			inputFiles.add(inputFile);
		}

		if (!inputBuffer) {
			// eslint-disable-next-line no-console
			console.warn(`"${src}" image could not be fetched`);
			continue;
		}

		const transforms = Array.from(transformsMap.entries());

		// process each transformed versiono of the
		for await (const [filename, transform] of transforms) {
			let outputFile: string;

			if (isRemoteImage(src)) {
				const outputFileURL = new URL(path.join('./', OUTPUT_DIR, path.basename(filename)), outDir);
				outputFile = fileURLToPath(outputFileURL);
			} else {
				const outputFileURL = new URL(path.join('./', OUTPUT_DIR, filename), outDir);
				outputFile = fileURLToPath(outputFileURL);
			}

			const { data } = await loader.transform(inputBuffer, transform);

			ensureDir(path.dirname(outputFile));

			await fs.writeFile(outputFile, data);
		}
	}

	// copy all original local images to dist
	for await (const original of inputFiles) {
		const to = original.replace(fileURLToPath(srcDir), fileURLToPath(outDir));

		await ensureDir(path.dirname(to));
		await fs.copyFile(original, to);
	}
}
