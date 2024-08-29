import node from '@astrojs/node'

export default {
    base: '/some-base',
    output: 'hybrid',
    trailingSlash: 'never',
    adapter: node({ mode: 'standalone' })
};
