import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { createGetFontData } from '../core/create-get-font-data.js';

export const getFontData = createGetFontData(fontsMod);

export async function getFontBuffer() {
	throw new Error('[astro:assets] `getFontBuffer()` is not available on the client.');
}
