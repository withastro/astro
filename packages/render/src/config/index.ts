import type { AstroConfigMinimal } from '../@types/config-minimal';

export let config: AstroConfigMinimal = {
  site: 'https://example.com',
  renderers: []
};

export function configure(options: AstroConfigMinimal): void {
  if (!config) {
    config = {} as any;
  }
  for (const [key, value] of Object.entries(options)) {
    config![key as keyof AstroConfigMinimal] = value && typeof value === 'object' ? Object.assign({}, value) : value;
  }
}

