import { fontDataByCssVariable } from 'virtual:astro:assets/fonts/internal';
import { runtimeFontFileUrlResolver } from 'virtual:astro:assets/fonts/runtime/font-file-url-resolver';
import { createGetFontFileURL } from './core/create-get-font-file-url.js';
const fontData = fontDataByCssVariable;
const experimental_getFontFileURL = createGetFontFileURL(runtimeFontFileUrlResolver);
export { experimental_getFontFileURL, fontData };
