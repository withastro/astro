import { expect } from "chai";
import * as cheerio from "cheerio";
import { fileURLToPath } from "node:url";
import { astroCli } from "./_test-utils.js";

const root = new URL("./fixtures/dev-runtime/", import.meta.url);
describe("Runtime Astro Dev", () => {
  let cli;
  before(async () => {
    cli = astroCli(fileURLToPath(root), "dev", "--host", "127.0.0.1");
    await new Promise((resolve) => {
      cli.stdout.on("data", (data) => {
        if (data.includes("http://127.0.0.1:4321/")) {
          resolve();
        }
      });
    });
  });

  after((done) => {
    cli.kill();
    setTimeout(() => {
      console.log("CLEANED");
      done();
    }, 1000);
  });

  it("exists", async () => {
    let res = await fetch(`http://127.0.0.1:4321/`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasRuntime").text()).to.contain("true");
  });

  it("adds cf object", async () => {
    let res = await fetch(`http://127.0.0.1:4321/`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasCF").text()).to.equal("true");
  });

  it("adds cache mocking", async () => {
    let res = await fetch(`http://127.0.0.1:4321/caches`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasCACHE").text()).to.equal("true");
  });

  it("adds D1 mocking", async () => {
    let res = await fetch(`http://127.0.0.1:4321/d1`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasDB").text()).to.equal("true");
    expect($("#hasPRODDB").text()).to.equal("true");
    expect($("#hasACCESS").text()).to.equal("true");
  });

  it("adds R2 mocking", async () => {
    let res = await fetch(`http://127.0.0.1:4321/r2`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasBUCKET").text()).to.equal("true");
    expect($("#hasPRODBUCKET").text()).to.equal("true");
    expect($("#hasACCESS").text()).to.equal("true");
  });

  it("adds KV mocking", async () => {
    let res = await fetch(`http://127.0.0.1:4321/kv`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasKV").text()).to.equal("true");
    expect($("#hasPRODKV").text()).to.equal("true");
    expect($("#hasACCESS").text()).to.equal("true");
  });

  it("adds DO mocking", async () => {
    let res = await fetch(`http://127.0.0.1:4321/do`);
    let html = await res.text();
    let $ = cheerio.load(html);
    expect($("#hasDO").text()).to.equal("true");
  });
});
