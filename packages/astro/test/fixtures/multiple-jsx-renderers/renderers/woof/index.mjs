// @ts-check
import * as devalue from 'devalue';

/** @param {{ include?: import('vite').FilterPattern, exclude?: import('vite').FilterPattern }} options */
export default function ({ include, exclude } = {}) {
  /** @type {import('astro').AstroIntegration} */
  const integration = {
    name: 'woof',
    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig }) => {
        addRenderer({
          name: 'woof',
          serverEntrypoint: new URL('./woof-server.mjs', import.meta.url).href,
          clientEntrypoint: new URL('./woof-client.mjs', import.meta.url).href,
        });

        updateConfig({
          vite: {
            plugins: [
              {
                name: 'woof-jsx-transform',
                transform(code, id) {
                  if (!id.endsWith('.jsx') && !id.endsWith('.tsx')) return null;
                  if (include && !id.endsWith('.woof.jsx')) return null;
                  return { code, map: null };
                },
              },
              {
                name: 'woof-opts',
                resolveId(id) {
                  if (id === 'astro:woof:opts') return '\0astro:woof:opts';
                },
                load(id) {
                  if (id === '\0astro:woof:opts') {
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
