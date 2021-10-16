import type { AstroConfigMinimal } from '../@types/config-minimal';

export let config: AstroConfigMinimal | null = null;

export function setConfig(options: AstroConfigMinimal): void {
  validateConfig(options);
  if (!config) {
    config = {} as any;
  }
  for (const [key, value] of Object.entries(options)) {
    config![key as keyof AstroConfigMinimal] = value && typeof value === 'object' ? Object.assign({}, value) : value;
  }
}

export function validateConfig(config: unknown) {
  if (!config) {
    throw new Error(`[Astro]: You must call \`setConfig(value)\` before rendering!`)
  }
  if (typeof config !== 'object') {
    throw new Error(`[Astro]: \`config\` must be of type "object". Found typeof "${typeof config}"!`)
  }
}
