import type { Plugin, InputOption } from 'rollup';
import type { AstroConfig, ComponentInstance, Renderer, RouteData } from '../@types/astro-core';
import type { InputHTMLOptions } from '@web/rollup-plugin-html';
import type { Location } from './extract-assets';
import type { ComponentPreload } from '../core/ssr';
import { addRollupInput } from './add-rollup-input.js';
import { findAssets, getSourcePaths } from './extract-assets.js';
import parse5 from 'parse5';
import * as path from 'path';

type AllPages = Record<string, RouteData & { paths: string[] }>;

interface PluginOptions {
  astroConfig: AstroConfig;
  pageModulesAndRenderers: ComponentPreload[];
}

const PLUGIN_NAME = '@astro/rollup-plugin-build';

export function rollupPluginAstroBuild({ astroConfig, pageModulesAndRenderers }: PluginOptions): Plugin {
  const assetInput: Set<string> = new Set();
  return {
    name: PLUGIN_NAME,

    options(inputOptions) {
      let projectRoot = astroConfig.projectRoot.pathname;
      let srcRoot = astroConfig.src.pathname;

      for(const [,mod] of pageModulesAndRenderers) {
        console.log(mod.$$metadata)
      }

      /*
      for(let input of inputs) {
        if(input.html) {
          let document = parse5.parse(input.html, {
            sourceCodeLocationInfo: true
          });
          let assets = findAssets(document);
          for(let node of assets) {
            let sourcePaths = getSourcePaths(node);
            for(let sourcePath of sourcePaths) {
              if(sourcePath.path.startsWith(srcRoot)) {
                let rel = path.relative(projectRoot, sourcePath.path);
                let pathname = '/' + rel;
                assetInput.add(pathname);
              }
            }
          }
        }
      }
      */

      console.log("ASSETS", assetInput);

      let out = addRollupInput(inputOptions, Array.from(assetInput));
      console.log("OUT", out.input);
      return out;
    },

    async renderChunk(code, chunk, opts) {
      console.log('rendering', chunk.facadeModuleId)
      debugger;
      return null;
    },

    /*
    buildStart(options) {
      debugger;
    },
    */

    async generateBundle(options, bundle) {
      debugger;
      let fn = this.getFileName('/src/styles/global.css');
      /*console.log("IM GENERATING THE BUNDLE", bundle);
      debugger;*/
    }
  }
}

/*
export function rollupPluginAstroBuildNext({ allPages }: PluginOptions): Plugin {
  const idToRouteMap = new Map(Object.entries(allPages).flatMap(([, route]) => route.paths.map(p => [pageId(p), route])));

  return {
    name: PLUGIN_NAME,

    options(inputOptions) {
      //reset();

      let input: InputOption[] = [];
      if(Array.isArray(inputOptions.input)) {
        input.push(...inputOptions.input);
      }

      //input.push('hello world')
      input.push(...idToRouteMap.keys())
      console.log("INPUT", input);

      return Object.assign(inputOptions, {
        input
      });
    },

    resolveId(spec) {
      if(spec === PLUGIN_NAME) {
        return PLUGIN_NAME;
      }
      if(idToRouteMap.has(spec)) {
        return spec;
      }
    },

    load(id) {
      if(idToRouteMap.has(id)) {
        console.log("OK", idToRouteMap.get(id))
      }
    }

    async generateBundle(options, bundle) {
      
    }
  };
}
*/