interface ModuleInfo {
  module: Record<string, any>;
  specifier: string;
}

interface ComponentMetadata {
  componentExport: string;
  componentUrl: string;
}

class Metadata {
  public fileURL: URL;
  private metadataCache: Map<any, ComponentMetadata | null>;
  constructor(fileURL: string, public modules: ModuleInfo[], components: any[]) {
    this.fileURL = new URL(fileURL);
    this.metadataCache = new Map<any, ComponentMetadata | null>();
  }

  getPath(Component: any): string | null {
    const metadata = this.getComponentMetadata(Component);
    return metadata?.componentUrl || null;
  }

  getExport(Component: any): string | null {
    const metadata = this.getComponentMetadata(Component);
    return metadata?.componentExport || null;
  }

  private getComponentMetadata(Component: any): ComponentMetadata | null {
    if (this.metadataCache.has(Component)) {
      return this.metadataCache.get(Component)!;
    }
    const metadata = this.findComponentMetadata(Component);
    this.metadataCache.set(Component, metadata);
    return metadata;
  }

  private findComponentMetadata(Component: any): ComponentMetadata | null {
    const isCustomElement = typeof Component === 'string';
    for (const { module, specifier } of this.modules) {
      const id = specifier.startsWith('.') ? new URL(specifier, this.fileURL).pathname : specifier;
      for (const [key, value] of Object.entries(module)) {
        if (isCustomElement) {
          if (key === 'tagName' && Component === value) {
            return {
              componentExport: key,
              componentUrl: id,
            };
          }
        } else if (Component === value) {
          return {
            componentExport: key,
            componentUrl: id,
          };
        }
      }
    }
    return null;
  }
}

interface CreateMetadataOptions {
  modules:  ModuleInfo[];
  hydratedComponents: any[];
  hoisted: any[];
}

export function createMetadata(fileURL: string, options: CreateMetadataOptions) {
  return new Metadata(fileURL, options.modules, options.hydratedComponents);
}
