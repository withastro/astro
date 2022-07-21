import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { OUTPUT_DIR } from '../constants.js';
import { SSRImageService, TransformOptions } from '../types.js';
import { isRemoteImage, loadLocalImage, loadRemoteImage } from '../utils/images.js';
import { ensureDir } from '../utils/paths.js';

export interface GenerateImagesProps {
	loader: SSRImageService;
	staticImages: Map<string, TransformOptions>;
	srcDir: URL;
	outDir: URL;
}

export async function generateImages({
	loader,
	staticImages,
	srcDir,
	outDir,
}: GenerateImagesProps) {
	// group transforms by unique original sources, allowing the Buffer to be reused for each transform
	const groups = Array.from(staticImages.entries()).reduce((acc, [filename, transform]) => {
		const srcGroup = acc.get(transform.src) || new Map<string, TransformOptions>();
		srcGroup.set(filename, transform);
		acc.set(transform.src, srcGroup);

		return acc;
	}, new Map<string, Map<string, TransformOptions>>());

	// process transforms one original image file at a time
	for await (const [src, transformsMap] of groups) {
		let inputFile: string | undefined = undefined;
		let inputBuffer: Buffer | undefined = undefined;

		if (isRemoteImage(src)) {
			// try to load the remote image
			inputBuffer = await loadRemoteImage(src);
		} else {
			const inputFileURL = new URL(`.${src}`, srcDir);
			inputFile = fileURLToPath(inputFileURL);
			inputBuffer = await loadLocalImage(inputFile);
		}

		if (!inputBuffer) {
			// eslint-disable-next-line no-console
			console.warn(`"${src}" image could not be fetched`);
			continue;
		}

		const transforms = Array.from(transformsMap.entries());

		// process file transforms in parallel
		await Promise.all(
			transforms.map(([filename, transform]) => {
				let outputFile: string;

				if (isRemoteImage(src)) {
					const outputFileURL = new URL(
						path.join('./', OUTPUT_DIR, path.basename(filename)),
						outDir
					);
					outputFile = fileURLToPath(outputFileURL);
				} else {
					const outputFileURL = new URL(path.join('./', OUTPUT_DIR, filename), outDir);
					outputFile = fileURLToPath(outputFileURL);
				}

				return loader.transform(inputBuffer!, transform).then(({ data }) => {
					ensureDir(path.dirname(outputFile));
					return fs.writeFile(outputFile, data);
				});
			})
		);

		if (inputFile) {
			// for local files, copy the original to dist
			const from = inputFile;
			const to = inputFile.replace(fileURLToPath(srcDir), fileURLToPath(outDir));

			ensureDir(path.dirname(to));
	
			await fs.copyFile(from, to);
		}
	}
}
