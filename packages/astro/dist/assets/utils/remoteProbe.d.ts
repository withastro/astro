import type { AstroConfig } from '../../types/public/config.js';
import type { ImageMetadata } from '../types.js';
type RemoteImageConfig = Pick<AstroConfig['image'], 'domains' | 'remotePatterns'>;
/**
 * Infers the dimensions of a remote image by streaming its data and analyzing it progressively until sufficient metadata is available.
 *
 * @param {string} url - The URL of the remote image from which to infer size metadata.
 * @param {RemoteImageConfig} [imageConfig] - Optional image config used to validate remote allowlists.
 * @return {Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>} Returns a promise that resolves to an object containing the image dimensions metadata excluding `src` and `fsPath`.
 * @throws {AstroError} Thrown when the fetching fails or metadata cannot be extracted.
 */
export declare function inferRemoteSize(
	url: string,
	imageConfig?: RemoteImageConfig,
): Promise<Omit<ImageMetadata, 'src' | 'fsPath'>>;
export {};
