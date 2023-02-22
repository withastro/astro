import fs from "node:fs";
import { joinPaths, prependForwardSlash } from "./utils/paths.js";

export default function og() {
  let _config;
  let staticImages = new Map();
  return {
    name: "@astrojs/og",
    hooks: {
      "astro:config:setup"({ config, injectRoute, updateConfig, command }) {
        _config = config;
        const cache = new Map();
        globalThis.astroOG = {
          cache,
          addStaticImage(filename, data) {
            const name = `${prependForwardSlash("_og")}?q=${filename}`;
            staticImages.set(name, data);
            return name;
          },
          getImage(hash) {
            const name = cache.get(hash);
            if (name) {
              return staticImages.get(name);
            }
          },
        };

        if (command === "dev" || config.output === "server") {
          injectRoute({
            pattern: "/_og",
            entryPoint: "@astrojs/og/entrypoint",
          });
        }

        updateConfig({
          vite: {
            plugins: [
              {
                name: "@astrojs/og/assets",
                enforce: "pre",
                load(id) {
                  if (!id.endsWith("?asset")) return;
                  id = id.replace(/\?asset$/, "");
                  const buf = fs.readFileSync(id);
                  return `export default Buffer.from(${JSON.stringify(
                    Array.from(buf)
                  )})`;
                },
              },
              {
                name: "@astrojs/og/virtual",
                enforce: "pre",
                resolveId(id) {
                  if (id === "virtual:@astrojs/og") {
                    return `\0virtual:@astrojs/og`;
                  }
                },
                load(id) {
                  if (id !== `\0virtual:@astrojs/og`) return;
                  const values = {
                    output: config.output,
                    publicURL: new URL("./public", config.root).toString(),
                  };
                  let result = "";
                  for (const [key, value] of Object.entries(values)) {
                    result += `\nexport let ${key} = ${JSON.stringify(value)};`;
                  }
                  return result.trim();
                },
              },
            ],
            ssr: {
              noExternal: ["@astrojs/og/entrypoint", "@astrojs/og/components"],
              external: [
                "@astrojs/og",
                "yoga-wasm-web",
                "@resvg/resvg-wasm",
                "satori",
                "satori-html",
              ],
            },
          },
        });
      },
      "astro:build:setup": async () => {
        // Used to cache all images rendered to HTML
        // Added to globalThis to share the same map in Node and Vite
        function addStaticImage(filename, data) {
          const name = prependForwardSlash(
            joinPaths(
              _config.base,
              _config.build.assets,
              "_og",
              `${filename}.png`
            )
          );
          staticImages.set(name, data);
          return name;
        }
        // Helpers for building static images should only be available for SSG
        if (_config.output === "static") {
          globalThis.astroOG.addStaticImage = addStaticImage;
        }
      },
      "astro:build:generated": async ({ dir }) => {
        // for SSG builds, build all requested image transforms to dist
        if (staticImages.size > 0) {
          for (const [file, generate] of staticImages.entries()) {
            fs.mkdirSync(new URL("./", new URL("." + file, dir)), {
              recursive: true,
            });
            fs.writeFileSync(
              new URL("." + file, dir),
              await generate()
            );
          }
        }
      },
    },
  };
}
