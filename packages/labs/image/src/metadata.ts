import sharp from 'sharp';
import type { ImageMetadata } from "./types";

type MetadataResult = Pick<ImageMetadata, 'width'|'height'|'format'>;

export async function metadata(pathname: string): Promise<MetadataResult> {
	const sharpImage = sharp(pathname);
	const metadata = await sharpImage.metadata();

	// TODO: when will sharp.metadata() return undefined?

	return {
		width: metadata.width!,
		height: metadata.height!,
		format: metadata.format!
	}
}
