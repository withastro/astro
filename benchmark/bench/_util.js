import { createRequire } from 'module';

export const astroBin = createRequire(import.meta.url).resolve('astro');
