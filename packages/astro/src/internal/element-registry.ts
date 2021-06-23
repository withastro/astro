import type { AstroComponentProps } from './__astro_component';

type ModuleCandidates = Map<any, string>;

interface RegistryOptions {
  candidates: ModuleCandidates;
}
class AstroElementRegistry {
  private candidates: ModuleCandidates;

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

  astroComponentArgs(tagName: string, props: AstroComponentProps) {
    const specifier = this.find(tagName);
    const outProps: AstroComponentProps = {
      ...props,
      componentUrl: specifier || props.componentUrl
    };
    return [tagName, outProps];
  }
}

export { AstroElementRegistry };