const { readFile } = require("fs").promises;

// Snowpack plugins must be CommonJS :(
const transformPromise = import("./lib/transform2.js");

module.exports = function (snowpackConfig, { resolve } = {}) {
  return {
    name: "snowpack-hmx",
    knownEntrypoints: ["deepmerge"],
    resolve: {
      input: [".hmx", ".md"],
      output: [".js"],
    },
    async load({ filePath }) {
      const { compilePage, compileComponent } = await transformPromise;
      const contents = await readFile(filePath, "utf-8");

      if (!filePath.includes("/pages/") && !filePath.includes("/layouts/")) {
        const result = await compileComponent(contents, filePath, { resolve });
        return result.contents;
      }

      const result = await compilePage(contents, filePath, { resolve });

      try {
            return /* js */ `
            ${result.contents}

          export default async (childDatas, childRenderFns) => {
            // Kind of hacky, can clean up if this works
            const renderHmx = {setup, head, body};
            const merge = (await import('deepmerge')).default;
            const content = childDatas && childDatas[0].content;
            const _data = await renderHmx.setup({content});
            if (_data.layout) {
              const renderLayout = (await import('/_hmx/layouts/' + _data.layout.replace(/.*layouts\\//, "").replace(/\.hmx$/, '.js'))).default;
              return renderLayout(
                [...(childDatas || []), _data], 
                [...(childRenderFns || []), renderHmx]
              );
            }
            const data = merge.all([_data, ...(childDatas || [])]);
            let headResult; 
            let bodyResult;
            for (const renderFn of (childRenderFns || [])) {
              let headAndBody = await Promise.all([
                renderFn.head(data, headResult),
                renderFn.body(data, bodyResult)
              ]);
              headResult = headAndBody[0];
              bodyResult = headAndBody[1];
            }
            return h(Fragment, null, [
              renderHmx.head(data, headResult, true),
              renderHmx.body(data, bodyResult, true),
            ]); 
          };
          `;
      } catch (err) {
        console.error(err);
      }

      return result.contents;
    },
  };
};
