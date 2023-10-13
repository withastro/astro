import { fileURLToPath } from "node:url";
import { execa } from "execa";
/**
 * @typedef {{ stop: Promise<void>, port: number }} WranglerCLI
 */

const astroPath = fileURLToPath(
  new URL("../node_modules/.bin/astro", import.meta.url)
);
/** Returns a process running the Astro CLI. */
export function astroCli(cwd, /** @type {string[]} */ ...args) {
  const spawned = execa(astroPath, [...args], {
    env: { ASTRO_TELEMETRY_DISABLED: true },
    cwd: cwd,
  });

  spawned.stdout.setEncoding("utf8");

  return spawned;
}

const wranglerPath = fileURLToPath(
  new URL("../node_modules/wrangler/bin/wrangler.js", import.meta.url)
);
/** Returns a process running the Astro CLI. */
export function wranglerCli(cwd) {
  const spawned = execa(
    wranglerPath,
    [
      "pages",
      "dev",
      "dist",
      "--port",
      "8788",
      "--compatibility-date",
      new Date().toISOString().slice(0, 10),
      "--log-level",
      "info",
    ],
    {
      env: { CI: 1, CF_PAGES: 1 },
      cwd: cwd,
    }
  );

  spawned.stdout.setEncoding("utf8");
  spawned.stderr.setEncoding("utf8");

  return spawned;
}
