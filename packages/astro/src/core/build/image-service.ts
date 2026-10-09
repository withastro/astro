import { fileURLToPath } from 'node:url';
import type * as vite from 'vite';
import { IMAGE_SERVICE_ENVIRONMENT_NAME, VIRTUAL_SERVICE_ID } from '../../assets/consts.js';
import { isLocalService, type LocalImageService } from '../../assets/services/service.js';
import { getImageServiceConfig } from '../../assets/utils/service-config.js';
import { getPrerenderOutputDirectory } from '../../prerender/utils.js';
import type { AstroSettings } from '../../types/astro.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { viteBuildReturnToRolldownOutputs } from './util.js';

const IMAGE_SERVICE_ENTRY_NAME = 'image-service';
const IMAGE_SERVICE_ENTRY_ID = 'virtual:astro:image-service-entry';
const RESOLVED_IMAGE_SERVICE_ENTRY_ID = '\0' + IMAGE_SERVICE_ENTRY_ID;

function getImageServiceOutputDirectory(settings: AstroSettings): URL {
	return new URL(`${IMAGE_SERVICE_ENTRY_NAME}/`, getPrerenderOutputDirectory(settings));
}

/**
 * A Node environment that builds only the `build` image service. Images are always generated in
 * Node, whatever runtime the adapter prerenders pages in, so the service is built separately
 * from the prerender bundle. Local files go through the same plugins (aliases, TypeScript, ...)
 * and get bundled. Packages stay external, even linked ones, so their dependencies resolve from
 * the package (e.g. `sharp` from `astro`), unless their entrypoint needs compiling (e.g. `.ts`).
 */
export function getImageServiceEnvironmentOptions(
	settings: AstroSettings,
): vite.EnvironmentOptions {
	return {
		consumer: 'server',
		resolve: { external: true },
		build: {
			outDir: fileURLToPath(getImageServiceOutputDirectory(settings)),
			emitAssets: false,
			ssr: true,
			rolldownOptions: {
				// A string, so it replaces any shared `input` instead of being merged with it.
				input: IMAGE_SERVICE_ENTRY_ID,
				// Hashed, so a rebuild in the same process doesn't import a cached module.
				output: { entryFileNames: `${IMAGE_SERVICE_ENTRY_NAME}.[hash].mjs`, format: 'esm' },
			},
		},
	};
}

/**
 * The entry of the image service environment. It re-exports the service, as an entry can't be
 * external.
 */
export function pluginImageServiceEntry(): vite.Plugin {
	return {
		name: '@astro/plugin-image-service-entry',
		applyToEnvironment: (environment) => environment.name === IMAGE_SERVICE_ENVIRONMENT_NAME,
		resolveId: {
			filter: { id: new RegExp(`^${IMAGE_SERVICE_ENTRY_ID}$`) },
			handler: () => RESOLVED_IMAGE_SERVICE_ENTRY_ID,
		},
		load: {
			filter: { id: new RegExp(`^${RESOLVED_IMAGE_SERVICE_ENTRY_ID}$`) },
			handler: () => `export { default } from ${JSON.stringify(VIRTUAL_SERVICE_ID)};`,
		},
	};
}

/**
 * Builds the image service environment and imports the `build` image service in Node. Only
 * called when there are images to generate.
 */
export async function loadBuildImageService(
	builder: vite.ViteBuilder,
	settings: AstroSettings,
): Promise<LocalImageService> {
	const { entrypoint } = getImageServiceConfig(settings.config.image.service, 'build');
	let service;
	try {
		const output = await builder.build(builder.environments[IMAGE_SERVICE_ENVIRONMENT_NAME]);
		const entry = viteBuildReturnToRolldownOutputs(output)
			.flatMap((o) => o.output)
			.find((chunk) => chunk.type === 'chunk' && chunk.isEntry);
		if (!entry) throw new Error('The image service build produced no entry chunk.');
		const url = new URL(entry.fileName, getImageServiceOutputDirectory(settings));
		service = (await import(url.href)).default;
	} catch (cause) {
		throw new AstroError(
			{
				...AstroErrorData.InvalidImageService,
				message: `Could not load the image service \`${entrypoint}\` to generate images in Node.`,
			},
			{ cause },
		);
	}
	if (!isLocalService(service)) {
		throw new AstroError({
			...AstroErrorData.InvalidImageService,
			message: `The image service \`${entrypoint}\` generates prerendered images during the build, but it is not a local service: it doesn't implement \`transform()\`.`,
		});
	}
	return service;
}
