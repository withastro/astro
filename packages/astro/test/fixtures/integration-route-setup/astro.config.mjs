import { defineConfig } from 'astro/config'
import test from './integration.js'
import node from '@astrojs/node';

export default defineConfig({
	output: 'hybrid',
	adapter: node({ mode: 'standalone' }),
	integrations: [test()]
})
