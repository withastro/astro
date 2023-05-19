export const PROPAGATED_ASSET_FLAG = 'astroPropagatedAssets';
export const CONTENT_FLAG = 'astroContentCollectionEntry';
export const DATA_FLAG = 'astroDataCollectionEntry';
export const CONTENT_FLAGS = [CONTENT_FLAG, DATA_FLAG, PROPAGATED_ASSET_FLAG] as const;

export const VIRTUAL_MODULE_ID = 'astro:content';
export const LINKS_PLACEHOLDER = '@@ASTRO-LINKS@@';
export const STYLES_PLACEHOLDER = '@@ASTRO-STYLES@@';
export const SCRIPTS_PLACEHOLDER = '@@ASTRO-SCRIPTS@@';

export const CONTENT_TYPES_FILE = 'types.d.ts';
