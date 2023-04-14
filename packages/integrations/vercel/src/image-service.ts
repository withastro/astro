import type { AstroConfig, ExternalImageService, ImageQualityPreset, ImageTransform } from 'astro';

// https://vercel.com/docs/build-output-api/v3/configuration#images
type ImageFormat = 'image/avif' | 'image/webp';

type RemotePattern = {
	protocol?: 'http' | 'https';
	hostname: string;
	port?: string;
	pathname?: string;
};

export type VercelImageConfig = {
	/**
	 * Supported image widths.
	 */
	sizes: number[];
	/**
	 * Allowed external domains that can use Image Optimization. Leave empty for only allowing the deployment domain to use Image Optimization.
	 */
	domains: string[];
	/**
	 * Allowed external patterns that can use Image Optimization. Similar to `domains` but provides more control with RegExp.
	 */
	remotePatterns?: RemotePattern[];
	/**
	 * Cache duration (in seconds) for the optimized images.
	 */
	minimumCacheTTL?: number;
	/**
	 * Supported output image formats
	 */
	formats?: ImageFormat[];
	/**
	 * Allow SVG input image URLs. This is disabled by default for security purposes.
	 */
	dangerouslyAllowSVG?: boolean;
	/**
	 * Change the [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) of the optimized images.
	 */
	contentSecurityPolicy?: string;
};

const qualityTable: Record<ImageQualityPreset, number> = {
	low: 25,
	mid: 50,
	high: 80,
	max: 100,
};

const mode = (import.meta as any).env.MODE as 'development' | 'production';

const service: ExternalImageService = {
	validateOptions(options, serviceOptions) {
		const vercelImageOptions = serviceOptions as VercelImageConfig;

		if (
			mode === 'development' &&
			(!vercelImageOptions.sizes || vercelImageOptions.sizes.length === 0)
		) {
			console.warn('Vercel Image Optimization requires at least one size to be configured.');
		}

		const configuredWidths = vercelImageOptions.sizes.sort((a, b) => a - b);
		const largestWidth = configuredWidths.at(-1);

		if (!options.width) {
			options.width = largestWidth;
		} else {
			if (!configuredWidths.includes(options.width)) {
				const nearestWidth = configuredWidths.reduce((prev, curr) => {
					return Math.abs(curr - options.width!) < Math.abs(prev - options.width!) ? curr : prev;
				});

				options.width = nearestWidth;

				if (mode === 'development') {
					console.warn(
						`Width ${options.width} is currently missing from your Vercel Image Optimization configuration. Falling back to ${nearestWidth}.}`
					);
				}
			}
		}

		if (options.quality && typeof options.quality === 'string') {
			options.quality = options.quality in qualityTable ? qualityTable[options.quality] : undefined;
		}

		if (!options.quality) {
			options.quality = 100;
		}

		return options;
	},
	getURL: function (options: ImageTransform): string {
		const fileSrc =
			typeof options.src === 'string' ? options.src : removeLeadingForwardSlash(options.src.src);

		const searchParams = new URLSearchParams();
		searchParams.append('url', fileSrc);

		options.width && searchParams.append('w', options.width.toString());
		options.quality && searchParams.append('q', options.quality.toString());

		return '/_vercel/image?' + searchParams;
	},
};

// TODO: Remove once Astro 3.0 is out and `experimental.assets` is no longer needed
export function throwIfAssetsNotEnabled(
	config: AstroConfig,
	imageConfig: VercelImageConfig | undefined
) {
	if (!config.experimental.assets && imageConfig) {
		throw new Error(
			`Using the Vercel Image Optimization API requires \`experimental.assets\` to be enabled. See https://docs.astro.build/en/guides/assets/ for more information.`
		);
	}
}

function removeLeadingForwardSlash(path: string) {
	return path.startsWith('/') ? path.substring(1) : path;
}

export default service;
