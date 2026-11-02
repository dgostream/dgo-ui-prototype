const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

// Load the pure TypeScript modules with the project's existing compiler.
const cache = new Map();
function load(file) {
  file = path.resolve(__dirname, "..", file);
  if (cache.has(file)) return cache.get(file).exports;
  const module = { exports: {} };
  cache.set(file, module);
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const localRequire = (id) => id.startsWith("@/")
    ? load(`src/${id.slice(2)}.ts`)
    : id.startsWith(".") ? load(path.resolve(path.dirname(file), `${id}.ts`)) : require(id);
  new Function("require", "module", "exports", code)(localRequire, module, module.exports);
  return module.exports;
}

const catalog = load("src/utils/subscriptionCatalog.ts");
const paywall = load("src/utils/paywall.ts");
const { resolvePlanChange } = load("src/utils/planChanges.ts");
const nepal = catalog.SUBSCRIPTION_SKUS.filter((sku) => sku.region === "nepal");
const session = (sku, paidThrough = "2099-01-01T00:00:00Z") => ({ ...paywall.sessionFromSku(sku), paidThrough });

let scenarios = 0;
for (const owned of nepal) for (const target of nepal) for (const manage of [false, true]) {
  assert.deepEqual(resolvePlanChange(session(owned), target, manage), {
    kind: owned.id === target.id ? "current" : "support-required", amount: 0, allowed: false,
  });
  scenarios++;
}
for (const target of nepal) for (const manage of [false, true]) {
  assert.deepEqual(resolvePlanChange(session(nepal[0], "2020-01-01T00:00:00Z"), target, manage), {
    kind: "new", amount: target.price, allowed: true,
  });
  assert.equal(resolvePlanChange(null, target, manage).allowed, true);
  scenarios += 2;
}
const boundary = Date.parse("2026-11-02T12:00:00Z");
const ending = session(nepal[0], new Date(boundary).toISOString());
assert.equal(paywall.hasActiveNepalPlan(ending, boundary - 1), true);
assert.equal(paywall.hasActiveNepalPlan(ending, boundary), false);
assert.equal(paywall.hasActiveNepalPlan(session(nepal[0], "invalid")), true);

for (const region of ["za", "zb", "zc"]) {
  const mobile = catalog.findSku(region, "mobile", "03M");
  const plus = catalog.findSku(region, "plus", "03M");
  assert.equal(resolvePlanChange(session(mobile), plus, true).kind, "provider-upgrade");
  assert.equal(resolvePlanChange(session(plus), mobile, true).kind, "provider-downgrade");
  assert.equal(resolvePlanChange(session(plus), plus, true).allowed, false);
}

const stored = new Map();
global.window = {
  sessionStorage: { getItem: (key) => stored.get(key) ?? null, setItem: (key, value) => stored.set(key, value), removeItem: (key) => stored.delete(key) },
  localStorage: { getItem: () => "nepal" },
  dispatchEvent() {},
};
const active = session(nepal[0]);
stored.set(paywall.SESSION_SUBSCRIPTION, JSON.stringify(active));
for (const target of nepal) {
  assert.equal(paywall.activateNepalSubscription(target), false);
  assert.deepEqual(JSON.parse(stored.get(paywall.SESSION_SUBSCRIPTION)), active);
}
paywall.addEventPass("test-exclusive");
assert.deepEqual(paywall.getOwnedPasses(), ["test-exclusive"]);
stored.set(paywall.SESSION_SUBSCRIPTION, JSON.stringify(session(nepal[0], "2020-01-01T00:00:00Z")));
assert.equal(paywall.getSubscriptionSession(), null);
const before = Date.now();
assert.equal(paywall.activateNepalSubscription(nepal[3]), true);
const fresh = paywall.getSubscriptionSession();
assert.equal(fresh.skuId, nepal[3].id);
assert.ok(Date.parse(fresh.paidThrough) > before);
assert.ok(Math.abs(Date.parse(fresh.paidThrough) - Date.parse(paywall.sessionFromSku(nepal[3]).paidThrough)) < 1000);
assert.equal(fresh.nextBillingDate, null);
assert.equal(paywall.activateNepalSubscription(nepal[3]), false);
delete global.window;
console.log(`Passed ${scenarios} Nepal plan combinations, expiry boundaries, persistence guards, event passes, and Stripe regression checks.`);
