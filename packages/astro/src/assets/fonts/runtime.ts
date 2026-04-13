import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';
import { runtimeFontFetcher } from 'virtual:astro:assets/fonts/runtime/font-fetcher';
import { createGetFontBuffer } from './core/create-get-font-buffer.js';

export const fontData = fontDataByCssVariable;
export const experimental_getFontBuffer = createGetFontBuffer(runtimeFontFetcher);
