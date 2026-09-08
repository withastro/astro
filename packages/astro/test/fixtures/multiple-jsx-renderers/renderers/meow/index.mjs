// @ts-check
import * as devalue from 'devalue';

/** @param {{ include?: import('vite').FilterPattern, exclude?: import('vite').FilterPattern }} options */
export default function ({ include, exclude } = {}) {
  /** @type {import('astro').AstroIntegration} */
  const integration = {
    name: 'meow',
    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig }) => {
        addRenderer({
          name: 'meow',
          serverEntrypoint: new URL('./meow-server.mjs', import.meta.url).href,
          clientEntrypoint: new URL('./meow-client.mjs', import.meta.url).href,
        });

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'meow-jsx-transform',
                transform(code, id) {
                  if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return null;
                  if (include && !id.endsWith('.meow.jsx')) return null;
                  return { code, map: null };
                },
              },
              {
                name: 'meow-opts',
                resolveId(id) {
                  if (id === 'astro:meow:opts') return '\0astro:meow:opts';
                },
                load(id) {
                  if (id === '\0astro:meow:opts') {
                    return {
                      code: `export default {
                        include: ${devalue.uneval(include ?? null)},
                        exclude: ${devalue.uneval(exclude ?? null)}
                      }`,
                    };
                  }
                },
              },
            ],
          },
        });
      },
    },
  };

  return integration;
}
