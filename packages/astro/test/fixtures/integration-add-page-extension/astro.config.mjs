import { defineConfig } from 'rollup'
import test from './integration.js'

export default defineConfig({
	integrations: [test()]
})
