import Atomico from "@atomico/vite";
/**
 *
 * @returns {import("astro").AstroRenderer}
 */
function getRenderer() {
  return {
    name: "@astrojs/atomico",
    clientEntrypoint: "@astrojs/atomico/client",
    serverEntrypoint: "@astrojs/atomico/server",
    jsxImportSource: "atomico",
    jsxTransformOptions: async () => {
      const {
        default: { default: jsx },
      } = await import("@babel/plugin-transform-react-jsx");
      return {
        plugins: [jsx({}, { runtime: "automatic", importSource: "atomico" })],
      };
    },
  };
}

/**
 *
 * @returns {import("astro").AstroIntegration}
 */
export default function ({
  cssLiterals = { minify: false, postcss: false },
} = {}) {
  return {
    name: "@astrojs/atomico",
    hooks: {
      "astro:config:setup": ({ addRenderer, updateConfig }) => {
        addRenderer(getRenderer());
        updateConfig({
          vite: {
            optimizeDeps: {
              include: ["atomico", "atomico/jsx-runtime"],
              exclude: ["@astrojs/atomico/server"],
            },
            plugins: [Atomico({ jsx: false, cssLiterals })],
          },
        });
      },
    },
  };
}
