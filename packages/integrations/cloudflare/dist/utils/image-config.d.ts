import type { AstroConfig, AstroIntegrationLogger, HookParameters } from 'astro';
export type ImageServiceMode =
	| 'passthrough'
	| 'cloudflare'
	| 'cloudflare-binding'
	| 'compile'
	| 'custom';
export type ImageServiceConfig =
	| ImageServiceMode
	| {
			build: 'compile';
			runtime?: 'passthrough' | 'cloudflare-binding';
	  };
/** Normalize string | compound config into separate build/runtime modes. */
export declare function normalizeImageServiceConfig(config: ImageServiceConfig | undefined): {
	buildService: ImageServiceMode;
	runtimeService: ImageServiceMode;
};
export declare function setImageConfig(
	service: ImageServiceConfig | undefined,
	config: AstroConfig['image'],
	command: HookParameters<'astro:config:setup'>['command'],
	logger: AstroIntegrationLogger,
):
	| {
			service: {
				entrypoint: string;
			};
			endpoint: {
				entrypoint: string;
			};
			dangerouslyProcessSVG: boolean;
			domains: string[];
			remotePatterns: {
				protocol?: string | undefined;
				hostname?: string | undefined;
				port?: string | undefined;
				pathname?: string | undefined;
			}[];
			responsiveStyles: boolean;
			layout?: 'fixed' | 'none' | 'constrained' | 'full-width' | undefined;
			objectFit?: string | undefined;
			objectPosition?: string | undefined;
			breakpoints?: number[] | undefined;
	  }
	| {
			service: import('astro').ImageServiceConfig<Record<string, any>>;
			endpoint: {
				route: string;
				entrypoint?: string | undefined;
			};
			dangerouslyProcessSVG: boolean;
			domains: string[];
			remotePatterns: {
				protocol?: string | undefined;
				hostname?: string | undefined;
				port?: string | undefined;
				pathname?: string | undefined;
			}[];
			responsiveStyles: boolean;
			layout?: 'fixed' | 'none' | 'constrained' | 'full-width' | undefined;
			objectFit?: string | undefined;
			objectPosition?: string | undefined;
			breakpoints?: number[] | undefined;
	  };
