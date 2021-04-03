declare module 'postcss-icss-keyframes' {
  import type { Plugin } from 'postcss';

  export default function (options: { generateScopedName(keyframesName: string, filepath: string, css: string): string }): Plugin;
}
