import * as fontsMod from 'virtual:astro:assets/fonts/internal';

// TODO: remove default when stabilizing
export const fontData = fontsMod.fontDataByCssVariable ?? {};

export async function getFontBuffer() {
	throw new Error('[astro:assets] `getFontBuffer()` is not available on the client.');
}
