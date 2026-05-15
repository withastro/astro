import type { AstroConfig } from '../types/public/config.js';
import type { AstroAdapterClientConfig } from '../types/public/integrations.js';
import { type ImageService } from './services/service.js';
import { type GetImageResult, type UnresolvedImageTransform } from './types.js';
export { verifyOptions } from './services/service.js';
export declare const cssFitValues: string[];
export declare function getConfiguredImageService(): Promise<ImageService>;
export declare function getImage(
	options: UnresolvedImageTransform,
	imageConfig: AstroConfig['image'] & AstroAdapterClientConfig,
): Promise<GetImageResult>;
