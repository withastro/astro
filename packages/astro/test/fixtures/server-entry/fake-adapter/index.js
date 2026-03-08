// @ts-check

const ENTRYPOINT = '@test/server-entry-fake-adapter/server.js'

/**
 * @param {{ type: 'rollupInput'; shape: 'string' | 'object' | 'array' } | { type: 'serverEntrypoint' }} options
 * @returns {import('astro').AstroIntegration}
 */
export default function fakeAdapter(options) {
    return {
        name: '@test/server-entry-fake-adapter',
        hooks: {
            'astro:config:setup': (params) => {
                if (options.type === 'rollupInput') {
                params.updateConfig({
                    vite: {
                        build: {
                            rollupOptions: {
                                input: {
                                    string: ENTRYPOINT,
                                    object: { foo: ENTRYPOINT },
                                    array: [ENTRYPOINT]
                                }[options.shape]
                            }
                        }
                    }
                })
            }
            },
            'astro:config:done': (params) => {
                params.setAdapter({
                    name:'@test/server-entry-fake-adapter',
                    entrypointResolution: 'auto',
                    serverEntrypoint: options.type === 'serverEntrypoint' ? ENTRYPOINT : undefined,
                    supportedAstroFeatures: {
                        serverOutput: 'stable'
                    }
                })
            }
        }
    }
}