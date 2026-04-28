import type * as VirtualModule from '../../dist/_internal/runtime/virtual.d.ts';

const virtualPath: string = '../../dist/runtime/virtual.js';
const virtualModule: any = await import(virtualPath);

// Ensure the correct types are being used for tests...
// This is a workaround due to the types being exported under /_internal/ path
// and not under /runtime/ path.
export const column: typeof VirtualModule.column = virtualModule.column;
export const defineTable: typeof VirtualModule.defineTable = virtualModule.defineTable;
export const NOW: typeof VirtualModule.NOW = virtualModule.NOW;
