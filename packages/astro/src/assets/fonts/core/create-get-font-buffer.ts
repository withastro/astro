import { AstroError, AstroErrorData } from '../../../core/errors/index.js';
import type { BufferImports } from './../types.js';

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
