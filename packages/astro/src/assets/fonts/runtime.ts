import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';
import { runtimeFontFileUrlResolver } from 'virtual:astro:assets/fonts/runtime/font-file-url-resolver';
import { createGetFontFileURL } from './core/create-get-font-file-url.js';

export const fontData = fontDataByCssVariable;
export const experimental_getFontFileURL = createGetFontFileURL(runtimeFontFileUrlResolver);
