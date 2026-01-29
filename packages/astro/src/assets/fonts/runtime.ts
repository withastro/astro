import * as fontsInternalMod from 'virtual:astro:assets/fonts/internal';
import * as fontsFetcherMod from 'virtual:astro:assets/fonts/runtime/font-fetcher';
import { createGetFontBuffer } from './core/create-get-font-buffer.js';

// TODO: remove default when stabilizing
export const fontData = fontsInternalMod.fontDataByCssVariable ?? {};

export const getFontBuffer = createGetFontBuffer(fontsFetcherMod);
