import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';

export const fontData = fontDataByCssVariable;

export async function getFontBuffer() {
	throw new Error('[astro:assets] `getFontBuffer()` is not available on the client.');
}
