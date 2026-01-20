import * as fontsMod from 'virtual:astro:assets/fonts/internal';
import { createGetFontData } from './core/create-get-font-data.js';

export const getFontData = createGetFontData(fontsMod);
