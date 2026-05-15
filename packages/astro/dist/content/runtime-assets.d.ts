import type { PluginContext } from 'rollup';
import * as z from 'zod/v4';
export declare function createImage(
	pluginContext: PluginContext,
	shouldEmitFile: boolean,
	entryFilePath: string,
): () => z.ZodPipe<
	z.ZodString,
	z.ZodTransform<
		| z.ZodNever
		| {
				ASTRO_ASSET: string;
				format: import('../assets/types.js').ImageInputFormat;
				src: string;
				width: number;
				height: number;
				fsPath: string;
				orientation?: number | undefined;
		  },
		string
	>
>;
