import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { AstroError, AstroErrorData } from '../../core/errors/index.js';
import { createGetFontData } from './core/create-get-font-data.js';
import type { BufferImports } from './types.js';

export const getFontData = createGetFontData(fontsMod);

export function createGetFontBuffer({ bufferImports }: { bufferImports?: BufferImports }) {
	return async function getFontBuffer(url: string) {
		// TODO: remove once fonts are stabilized
		if (!bufferImports) {
			throw new AstroError(AstroErrorData.ExperimentalFontsNotEnabled);
		}
		// Should always be able to split but we default to a hash that will always fail
		const hash = url.split('/').pop() ?? '';
		const fn = bufferImports[hash];
		if (!fn) {
			throw new AstroError({
				...AstroErrorData.FontBufferNotFound,
				message: AstroErrorData.FontBufferNotFound.message(url),
			});
		}
		let mod;
		try {
			mod = await fn();
		} catch {
			throw new AstroError({
				...AstroErrorData.FontBufferNotFound,
				message: AstroErrorData.FontBufferNotFound.message(url),
			});
		}
		if (!mod?.default) {
			throw new AstroError({
				...AstroErrorData.FontBufferNotFound,
				message: AstroErrorData.FontBufferNotFound.message(url),
			});
		}
		return mod.default;
	};
}
