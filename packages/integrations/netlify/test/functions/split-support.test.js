import { expect } from "chai";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { cli } from "./test-utils.js";

const root = new URL(
  "../functions/fixtures/split-support/",
  import.meta.url
).toString();

describe("Split support", () => {
  let _entryPoints;

  before(async () => {
    await cli("build", "--root", fileURLToPath(root));
  });

  it("outputs a correct redirect file", async () => {
    let redir = await fs.readFile(new URL("./dist/_redirects", root), "utf-8");
    const lines = redir.split(/[\r\n]+/);
    expect(lines.length).to.equal(3);

    expect(lines[0].includes("/blog")).to.be.true;
    expect(lines[0].includes("blog.astro")).to.be.true;
    expect(lines[0].includes("200")).to.be.true;
    expect(lines[1].includes("/")).to.be.true;
    expect(lines[1].includes("index.astro")).to.be.true;
    expect(lines[1].includes("200")).to.be.true;
  });

  describe("Should create multiple functions", () => {
    it("and hit 200", async () => {
      if (_entryPoints) {
        for (const [routeData, filePath] of _entryPoints) {
          if (routeData.route !== "/_image") {
            const { handler } = await import(filePath.toString());
            const resp = await handler({
              httpMethod: "GET",
              headers: {},
              rawUrl: `http://example.com${routeData.route}`,
              body: "{}",
            });
            expect(resp.statusCode).to.equal(200);
          }
        }
      } else {
        expect(false).to.be.true;
      }
    });
  });
});
