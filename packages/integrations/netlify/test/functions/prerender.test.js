import { expect } from "chai";
import fs from "fs/promises";
import { cli } from "./test-utils.js";
import { fileURLToPath } from "url";

const root = new URL("./fixtures/prerender/", import.meta.url).toString();

describe("Mixed Prerendering with SSR", () => {
  before(async () => {
    process.env.PRERENDER = true;
    await cli("build", "--root", fileURLToPath(root));
  });

  after(() => {
    delete process.env.PRERENDER;
  });

  it("Wildcard 404 is sorted last", async () => {
    const redir = await fs.readFile(
      new URL("./dist/_redirects", root),
      "utf-8",
    );
    const baseRouteIndex = redir.indexOf(
      "/          /.netlify/functions/entry    200",
    );
    const oneRouteIndex = redir.indexOf(
      "/one       /one/index.html              200",
    );
    const fourOhFourWildCardIndex = redir.indexOf(
      "/*         /.netlify/functions/entry    404",
    );

    expect(oneRouteIndex).to.not.be.equal(-1);
    expect(fourOhFourWildCardIndex).to.be.greaterThan(baseRouteIndex);
    expect(fourOhFourWildCardIndex).to.be.greaterThan(oneRouteIndex);
  });
});

describe("Mixed Hybrid rendering with SSR", () => {
  before(async () => {
    process.env.PRERENDER = false;
    process.env.ASTRO_OUTPUT = "hybrid";
    await cli("build", "--root", fileURLToPath(root));
  });

  after(() => {
    delete process.env.PRERENDER;
  });

  it("outputs a correct redirect file", async () => {
    const redir = await fs.readFile(
      new URL("./dist/_redirects", root),
      "utf-8",
    );
    const baseRouteIndex = redir.indexOf(
      "/one       /.netlify/functions/entry    200",
    );
    const rootRouteIndex = redir.indexOf(
      "/          /index.html                  200",
    );
    const fourOhFourIndex = redir.indexOf(
      "/404       /404.html                    200",
    );
    const imageEndpoint = redir.indexOf(
      "/_image    /.netlify/functions/entry    200",
    );

    expect(rootRouteIndex).to.not.be.equal(-1);
    expect(baseRouteIndex).to.not.be.equal(-1);
    expect(fourOhFourIndex).to.not.be.equal(-1);
    expect(imageEndpoint).to.not.be.equal(-1);
  });
});
