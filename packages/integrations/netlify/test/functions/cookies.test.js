import { expect } from "chai";
import { cli } from "./test-utils.js";
import { fileURLToPath } from "url";

const root = new URL("./fixtures/cookies/", import.meta.url).toString();

describe("Cookies", () => {
  before(async () => {
    await cli("build", "--root", fileURLToPath(root));
  });

  it("Can set multiple", async () => {
    const entryURL = new URL(
      "./fixtures/cookies/.netlify/functions-internal/entry.mjs",
      import.meta.url,
    );
    const { handler } = await import(entryURL);
    const resp = await handler({
      httpMethod: "POST",
      headers: {},
      rawUrl: "http://example.com/login",
      body: "{}",
      isBase64Encoded: false,
    });
    expect(resp.statusCode).to.equal(301);
    expect(resp.headers.location).to.equal("/");
    expect(resp.multiValueHeaders).to.be.deep.equal({
      "set-cookie": ["foo=foo; HttpOnly", "bar=bar; HttpOnly"],
    });
  });
});
