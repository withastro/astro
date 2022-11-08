//import sizeOf from 'image-size';
import { InputFormat } from '../loaders/index.js';
import { ImageMetadata } from '../vite-plugin-astro-image.js';
import * as runtime from './runtime/index.js';


export interface Metadata extends ImageMetadata {
	orientation?: number;
}



export async function metadata(src: URL | string, data?: Buffer): Promise<Metadata | undefined> {
	await runtime.preload();
	const file = data ?? (await runtime.readFile(src));

	const { width, height, type, orientation } = { width: 0, height: 0, type: 'image/png', orientation: 0 } // await sizeOf(file as Buffer);
	const isPortrait = (orientation || 0) >= 5;

	if (!width || !height || !type) {
		return undefined;
	}

	return {
		src: runtime.fileURLToPath(src),
		width: isPortrait ? height : width,
		height: isPortrait ? width : height,
		format: type as InputFormat,
		orientation,
	};
}
