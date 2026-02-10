// @ts-check

/**
 * @param {{ shape: 'string' | 'object' | 'array' }} param0
 * @returns {import('astro').AstroIntegration}
 */
export default function fakeAdapter({ shape}) {
    return {
        name: '@test/server-entry-fake-adapter',
        hooks: {
            'astro:config:setup': (params) => {
                params.updateConfig({
                    vite: {
                        build: {
                            rollupOptions: {
                                input: {
                                    string: '@test/server-entry-fake-adapter/server.js',
                                    object: { foo: '@test/server-entry-fake-adapter/server.js' },
                                    array: ['@test/server-entry-fake-adapter/server.js']
                                }[shape]
                            }
                        }
                    }
                })
            },
            'astro:config:done': (params) => {
                params.setAdapter({
                    name:'@test/server-entry-fake-adapter',
                    entryType: 'self',
                    supportedAstroFeatures: {
                        serverOutput: 'stable'
                    }
                })
            }
        }
    }
}