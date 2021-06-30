import type { AstroComponentProps } from './__astro_component';

type ModuleCandidates = Map<any, string>;

interface RegistryOptions {
  candidates: ModuleCandidates;
}
class AstroElementRegistry {
  private candidates: ModuleCandidates;
  private cache: Map<string, string> = new Map();

  constructor(options: RegistryOptions) {
    this.candidates = options.candidates;
  }

  find(tagName: string) {
    for(let [module, importSpecifier] of this.candidates) {
      if(module && typeof module.tagName === 'string') {
        if(module.tagName === tagName) {
          // Found!
          return importSpecifier;
        }
      }
    }
  }

  findCached(tagName: string) {
    if(this.cache.has(tagName)) {
      return this.cache.get(tagName)!;
    }
    let specifier = this.find(tagName);
    if(specifier) {
      this.cache.set(tagName, specifier);
    }
    return specifier;
  }

  astroComponentArgs(tagName: string, props: AstroComponentProps) {
    const specifier = this.findCached(tagName);
    const outProps: AstroComponentProps = {
      ...props,
      componentUrl: specifier || props.componentUrl
    };
    return [tagName, outProps];
  }
}

export { AstroElementRegistry };