import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';
import { runtimeFontFileUrlResolver } from 'virtual:astro:assets/fonts/runtime/font-file-url-resolver';
import { createGetFontBufferURL } from './core/create-get-font-buffer-url.js';

export const fontData = fontDataByCssVariable;
export const experimental_getFontBufferURL = createGetFontBufferURL(runtimeFontFileUrlResolver);
