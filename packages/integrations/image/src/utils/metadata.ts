import sizeOf from 'image-size';
import { InputFormat } from '../loaders/index.js';
import { ImageMetadata } from '../vite-plugin-astro-image.js';
import { fileURLToPath, readFile, preload as preloadRuntime } from './runtime/index.js';


export interface Metadata extends ImageMetadata {
	orientation?: number;
}



export async function metadata(src: URL | string, data?: Buffer): Promise<Metadata | undefined> {
	await preloadRuntime();
	const file = data ?? (await readFile(src));

	const { width, height, type, orientation } = await sizeOf(file as Buffer);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src: fileURLToPath(src),
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as InputFormat,
		orientation,
	};
}
