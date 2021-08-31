import type { AstroMarkdownOptions } from '@astrojs/markdown-support';
import type { AstroConfigSchema } from '../config';
import type { z } from 'zod';

/**
 * The Astro User Config Format:
 * This is the type interface for your astro.config.mjs default export.
 */
export interface AstroUserConfig {
  /**
   * Where to resolve all URLs relative to. Useful if you have a monorepo project.
   * Default: '.' (current working directory)
   */
  projectRoot?: string;
  /**
   * Path to the `astro build` output.
   * Default: './dist'
   */
  dist?: string;
  /**
   * Path to all of your Astro components, pages, and data.
   * Default: './src'
   */
  src?: string;
  /**
   * Path to your Astro/Markdown pages. Each file in this directory
   * becomes a page in your final build.
   * Default: './src/pages'
   */
  pages?: string;
  /**
   * Path to your public files. These are copied over into your build directory, untouched.
   * Useful for favicons, images, and other files that don't need processing.
   * Default: './public'
   */
  public?: string;
  /**
   * Framework component renderers enable UI framework rendering (static and dynamic).
   * When you define this in your configuration, all other defaults are disabled.
   * Default: [
   *  '@astrojs/renderer-svelte',
   *  '@astrojs/renderer-vue',
   *  '@astrojs/renderer-react',
   *  '@astrojs/renderer-preact',
   * ],
   */
  renderers?: string[];
  /** Options for rendering markdown content */
  markdownOptions?: Partial<AstroMarkdownOptions>;
  /** Options specific to `astro build` */
  buildOptions?: {
    /** Your public domain, e.g.: https://my-site.dev/. Used to generate sitemaps and canonical URLs. */
    site?: string;
    /** Generate an automatically-generated sitemap for your build.
     * Default: true
     */
    sitemap?: boolean;
    /**
     * Control the output file URL format of each page.
     *   If 'file', Astro will generate a matching HTML file (ex: "/foo.html") instead of a directory.
     *   If 'directory', Astro will generate a directory with a nested index.html (ex: "/foo/index.html") for each page.
     * Default: 'directory'
     */
    pageUrlFormat?: 'file' | 'directory';
  };
  /** Options for the development server run with `astro dev`. */
  devOptions?: {
    hostname?: string;
    /** The port to run the dev server on. */
    port?: number;
    /** Path to tailwind.config.js, if used */
    tailwindConfig?: string;
    /**
     * Configure The trailing slash behavior of URL route matching:
     *   'always' - Only match URLs that include a trailing slash (ex: "/foo/")
     *   'never' - Never match URLs that include a trailing slash (ex: "/foo")
     *   'ignore' - Match URLs regardless of whether a trailing "/" exists
     * Default: 'always'
     */
    trailingSlash?: 'always' | 'never' | 'ignore';
  };
}

// NOTE(fks): We choose to keep our hand-generated AstroUserConfig interface so that
// we can add JSDoc-style documentation and link to the definition file in our repo.
// However, Zod comes with the ability to auto-generate AstroConfig from the schema
// above. If we ever get to the point where we no longer need the dedicated
// @types/config.ts file, consider replacing it with the following lines:
//
// export interface AstroUserConfig extends z.input<typeof AstroConfigSchema> {
//   markdownOptions?: Partial<AstroMarkdownOptions>;
// }
export interface AstroConfig extends z.output<typeof AstroConfigSchema> {
  markdownOptions: Partial<AstroMarkdownOptions>;
}
