import type { AstroAdapter, AstroIntegration } from "astro"

const PACKAGE_NAME = "@astrojs/aws/edge"

function getAdapter(): AstroAdapter {
  return {
    name: PACKAGE_NAME,
    serverEntrypoint: `${PACKAGE_NAME}/entrypoint`,
    exports: ["handler"],
  }
}

export default function createIntegration(): AstroIntegration {
  return {
    name: PACKAGE_NAME,
    hooks: {
      "astro:config:done": ({ setAdapter }) => {
        setAdapter(getAdapter())
      },
    },
  }
}
