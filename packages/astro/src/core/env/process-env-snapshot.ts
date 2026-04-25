/**
 * `loadConfigWithVite` spins up a temporary Vite dev server, which (like `vite dev`) merges
 * `.env*` into `process.env`. If that overwrites values that were set in the user’s
 * real environment, later calls to Vite’s `loadEnv` see the wrong `process.env` and can
 * no longer give shell/CI overrides priority over the repo’s `.env` file.
 *
 * This snapshot is captured the first time this module loads — before
 * `loadConfig` runs, because `import '../env/process-env-snapshot.js'` is the first
 * import in `core/config/config.ts` — and is merged in `getEnv` so CLI/shell
 * values win again, matching the behavior documented in Vite’s guide.
 * @see https://vite.dev/guide/env-and-mode.html#env-file-priority
 */
export const processEnvAtLaunch: NodeJS.ProcessEnv = { ...process.env };
