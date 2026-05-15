export declare const PROPAGATED_ASSET_FLAG = 'astroPropagatedAssets';
export declare const PROPAGATED_ASSET_QUERY_PARAM = '?astroPropagatedAssets';
export declare const CONTENT_RENDER_FLAG = 'astroRenderContent';
export declare const CONTENT_FLAG = 'astroContentCollectionEntry';
export declare const DATA_FLAG = 'astroDataCollectionEntry';
export declare const CONTENT_IMAGE_FLAG = 'astroContentImageFlag';
export declare const CONTENT_MODULE_FLAG = 'astroContentModuleFlag';
export declare const VIRTUAL_MODULE_ID = 'astro:content';
export declare const RESOLVED_VIRTUAL_MODULE_ID: string;
export declare const DATA_STORE_VIRTUAL_ID = 'astro:data-layer-content';
export declare const RESOLVED_DATA_STORE_VIRTUAL_ID: string;
export declare const MODULES_MJS_ID = 'astro:content-module-imports';
export declare const MODULES_MJS_VIRTUAL_ID: string;
export declare const DEFERRED_MODULE = 'astro:content-layer-deferred-module';
export declare const ASSET_IMPORTS_VIRTUAL_ID = 'astro:asset-imports';
export declare const ASSET_IMPORTS_RESOLVED_STUB_ID: string;
export declare const LINKS_PLACEHOLDER = '@@ASTRO-LINKS@@';
export declare const STYLES_PLACEHOLDER = '@@ASTRO-STYLES@@';
export declare const IMAGE_IMPORT_PREFIX = '__ASTRO_IMAGE_';
export declare const CONTENT_FLAGS: readonly [
	'astroContentCollectionEntry',
	'astroRenderContent',
	'astroDataCollectionEntry',
	'astroPropagatedAssets',
	'astroContentImageFlag',
	'astroContentModuleFlag',
];
export declare const CONTENT_TYPES_FILE = 'content.d.ts';
export declare const DATA_STORE_FILE = 'data-store.json';
export declare const ASSET_IMPORTS_FILE = 'content-assets.mjs';
export declare const MODULES_IMPORTS_FILE = 'content-modules.mjs';
export declare const COLLECTIONS_MANIFEST_FILE = 'collections/collections.json';
export declare const COLLECTIONS_DIR = 'collections/';
export declare const CONTENT_LAYER_TYPE = 'content_layer';
export declare const LIVE_CONTENT_TYPE = 'live';
