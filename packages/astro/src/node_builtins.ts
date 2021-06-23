import { builtinModules } from 'module';

export const nodeBuiltinsSet = new Set(builtinModules);
export const nodeBuiltinsMap = new Map(builtinModules.map((bareName) => [bareName, 'node:' + bareName]));
