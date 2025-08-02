import type { VFile } from 'vfile';
import type { VitePluginMdxOptions } from './vite-plugin-mdx.js';

let initialized = false;
let mdxHybridModule: any = null;

async function ensureInitialized(): Promise<void> {
  if (!initialized) {
    try {
      // Dynamic import of the mdx-hybrid module
      mdxHybridModule = await import('@mdx-hybrid/core');
      if (mdxHybridModule.initialize) {
        await mdxHybridModule.initialize();
      }
      initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize MDX-Hybrid module: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export async function createMdxHybridProcessor(opts: VitePluginMdxOptions) {
  await ensureInitialized();
  
  return {
    async process(vfile: VFile): Promise<VFile> {
      const { value, path } = vfile;
      
      try {
        // Use mdx-hybrid compiler with automatic engine selection
        const result = await mdxHybridModule.compile(String(value), {
          filepath: path,
          development: process.env.NODE_ENV !== 'production',
          jsx: true,
          jsxImportSource: 'astro',
          jsxRuntime: 'automatic',
          // MDX-Hybrid specific options
          engine: 'auto', // Automatically choose between Rust and JS
          remarkPlugins: opts.mdxOptions.remarkPlugins,
          rehypePlugins: opts.mdxOptions.rehypePlugins,
          recmaPlugins: opts.mdxOptions.recmaPlugins,
        });
        
        // Update vfile with compiled result
        vfile.value = result.code;
        // Source maps will be handled when available
        if (result.map) {
          vfile.map = result.map;
        }
        
        // Set metadata that MDX expects
        vfile.data.astro = vfile.data.astro || {};
        
        return vfile;
      } catch (error) {
        const err = error as any;
        err.file = path;
        throw err;
      }
    }
  };
}