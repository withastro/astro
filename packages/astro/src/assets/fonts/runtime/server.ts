import { fontDataByCssVariable, bufferImports } from 'virtual:astro:assets/fonts/internal';
import { createGetFontBuffer } from '../core/create-get-font-buffer.js';

export const fontData = fontDataByCssVariable;

export const getFontBuffer = createGetFontBuffer(bufferImports);
