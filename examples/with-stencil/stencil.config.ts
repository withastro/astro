import { Config } from '@stencil/core';

export const config: Config = {
  namespace: 'with-stencil',
  outputTargets: [
    {
      type: 'dist',
      dir: 'dist/stencil/out',
      esmLoaderPath: '../loader',
    },
    {
      type: 'dist-hydrate-script',
      dir: 'dist/stencil/hydrate'
    }
  ],
};
