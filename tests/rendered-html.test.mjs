import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the SnapChef experience", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>SnapChef — Cook with what you have<\/title>/i);
  assert.match(html, /What’s in your kitchen\?/);
  assert.match(html, /Find my recipes/);
  assert.match(html, /Upload a kitchen photo/);
  assert.match(html, /Search recipes or ingredients/);
  assert.match(html, /<select[^>]+id="recipe-category"/i);
  assert.match(html, /Vegetarian/);
  assert.match(html, /Saved/);
  assert.match(html, /Recent/);
  assert.match(html, /30 min or less/);
  assert.match(html, /I have everything/);
  assert.doesNotMatch(html, /codex-preview|Building your site|react-loading-skeleton/i);
});

test("image analysis fails safely when its secret is not configured", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-image`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/analyze-image", { method: "POST" }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: "Image recognition has not been configured yet." });
});
