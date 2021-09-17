import * as unified from 'unified';
import type { Plugin, UnifiedPluginImport } from './types';

async function importPlugin(p: string | UnifiedPluginImport): UnifiedPluginImport {
  if (typeof p === 'string') {
    return await import(p);
  }

  return await p;
}

export function loadPlugins(items: Plugin[]): Promise<[unified.Plugin] | [unified.Plugin, any]>[] {
  return items.map((p) => {
    return new Promise((resolve, reject) => {
      if (Array.isArray(p)) {
        const [plugin, opts] = p;
        return importPlugin(plugin)
          .then((m) => resolve([m.default, opts]))
          .catch((e) => reject(e));
      }

      return importPlugin(p)
        .then((m) => resolve([m.default]))
        .catch((e) => reject(e));
    });
  });
}
