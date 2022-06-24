import sharp from 'sharp';
import { ImageMetadata } from './types';

export async function metadata(src: string): Promise<ImageMetadata> {
	const image = sharp(src);
	const metadata = await image.metadata();

	return {
		width: metadata.width!,
		height: metadata.height!,
		format: metadata.format!
	}
}
