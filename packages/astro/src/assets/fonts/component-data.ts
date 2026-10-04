import { componentDataByCssVariable as data } from 'virtual:astro:assets/fonts/internal';

// Font.astro imports this compiled module instead of the virtual module, so the emitted .d.ts
// carries the resolved type. The virtual module is only declared in the unpublished
// dev-only.d.ts, so consumers type-checking .astro files can't resolve it.
// See https://github.com/withastro/astro/issues/18219
export const componentDataByCssVariable = data;
