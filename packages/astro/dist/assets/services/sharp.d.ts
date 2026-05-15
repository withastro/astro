import type {
	AvifOptions,
	JpegOptions,
	PngOptions,
	ResizeOptions,
	SharpOptions,
	WebpOptions,
} from 'sharp';
import { type BaseServiceTransform, type LocalImageService } from './service.js';
export interface SharpImageServiceConfig {
	/**
	 * The `limitInputPixels` option passed to Sharp. See https://sharp.pixelplumbing.com/api-constructor for more information
	 */
	limitInputPixels?: SharpOptions['limitInputPixels'];
	/**
	 * The `kernel` option is passed to resize calls. See https://sharp.pixelplumbing.com/api-resize/ for more information
	 */
	kernel?: ResizeOptions['kernel'];
	/**
	 * The default encoder options passed to `sharp().jpeg()`.
	 */
	jpeg?: JpegOptions;
	/**
	 * The default encoder options passed to `sharp().png()`.
	 */
	png?: PngOptions;
	/**
	 * The default encoder options passed to `sharp().webp()`.
	 */
	webp?: WebpOptions;
	/**
	 * The default encoder options passed to `sharp().avif()`.
	 */
	avif?: AvifOptions;
}
export declare function resolveSharpEncoderOptions(
	transform: Pick<BaseServiceTransform, 'format' | 'quality'>,
	inputFormat: string | undefined,
	serviceConfig?: SharpImageServiceConfig,
):
	| JpegOptions
	| PngOptions
	| WebpOptions
	| AvifOptions
	| {
			quality?: number;
	  }
	| undefined;
declare const sharpService: LocalImageService<SharpImageServiceConfig>;
export default sharpService;
