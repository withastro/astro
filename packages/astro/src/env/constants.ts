function resolveVirtualModuleId<T extends string>(id: T): `\0${T}` {
	return `\0${id}`;
}

export const VIRTUAL_CLIENT_MODULE_ID = 'astro:env/client';
export const RESOLVED_VIRTUAL_CLIENT_MODULE_ID = resolveVirtualModuleId(VIRTUAL_CLIENT_MODULE_ID);
export const VIRTUAL_SERVER_MODULE_ID = 'astro:env/server';
export const RESOLVED_VIRTUAL_SERVER_MODULE_ID = resolveVirtualModuleId(VIRTUAL_SERVER_MODULE_ID);

export const PUBLIC_PREFIX = 'PUBLIC_';