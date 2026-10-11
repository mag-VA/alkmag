import test from "node:test";
import assert from "node:assert/strict";
import {
  initialPlan,
  forecast,
  forecastItem,
  distribute,
  csv,
} from "./model.js";
const clone = () => structuredClone(initialPlan);
test("ROI uses total costs including channels without a revenue estimate", () => {
  const p = clone(),
    r = forecast(p);
  assert.equal(r.cost, 120000);
  assert.equal(r.roi, (((r.revenue * p.margin) / 100 - r.cost) / r.cost) * 100);
  assert.equal(r.coverage, 82.5);
  assert.equal(forecastItem(p.items[4], p).roi, null);
});
test("zero spend and zero margin stay finite", () => {
  const p = clone();
  p.budget = 0;
  p.margin = 0;
  p.items = p.items.map((i) => ({ ...i, amount: 0 }));
  const r = forecast(p);
  assert.equal(r.roi, 0);
  assert.equal(r.revenue, 0);
  assert.equal(r.breakeven, null);
  assert.equal(r.coverage, 0);
});
test("e-commerce and B2B follow separate conversion paths", () => {
  const p = clone();
  const i = { ...p.items[0], amount: 300, cpc: 3, conversion: 10 };
  p.aov = 100;
  p.incrementality = 100;
  p.overlap = 0;
  assert.equal(forecastItem(i, p).revenue, 1000);
  p.model = "B2B";
  p.qualified = 50;
  p.closeRate = 20;
  assert.equal(forecastItem(i, p).revenue, 100);
});
test("scale limit causes diminishing returns", () => {
  const p = clone();
  const i = { ...p.items[0], amount: 50000, scale: 50000 };
  assert.ok(forecastItem(i, p, 2).revenue < forecastItem(i, p).revenue * 2);
});
test("distribution preserves locked values and respects limits", () => {
  const p = clone();
  p.budget = 150000;
  p.items[0].locked = true;
  p.items[1].max = 28000;
  p.items[2].min = 20000;
  const items = distribute(p);
  assert.equal(items[0].amount, 42000);
  assert.equal(items[1].amount, 28000);
  assert.ok(items[2].amount >= 20000);
  assert.ok(
    Math.abs(items.reduce((s, i) => s + i.amount, 0) - p.budget) < 0.01,
  );
});
test("infeasible constraints provide a conflict instead of modifying values", () => {
  const p = clone();
  p.budget = 100;
  p.items[0].locked = true;
  assert.throws(() => distribute(p), /Ograniczenia/);
  assert.equal(p.items[0].amount, 42000);
});
test("deduplication never increases attributed revenue", () => {
  const p = clone();
  p.incrementality = 100;
  p.overlap = 0;
  const full = forecast(p).revenue;
  p.incrementality = 80;
  p.overlap = 25;
  assert.ok(Math.abs(forecast(p).revenue - full * 0.6) < 0.001);
});
test("subscription revenue respects churn and horizon", () => {
  const p = clone();
  p.model = "Subskrypcja";
  p.months = 2;
  p.churn = 10;
  const two = forecast(p).revenue;
  p.months = 1;
  assert.ok(Math.abs(two / forecast(p).revenue - 1.9) < 1e-10);
});
test("CSV preserves metadata and escapes names", () => {
  const p = clone();
  p.name = 'Plan "Firma"';
  const s = csv(p);
  assert.ok(s.includes('Plan ""Firma""'));
  assert.ok(s.includes('"Wersja";"1"'));
  assert.ok(s.includes('"Nakładanie odbiorców %";"10"'));
  assert.ok(s.includes("Nieoszacowany"));
});
test("CSV preserves Polish characters with a UTF-8 BOM", () => {
  const p = clone();
  p.name = "Żółć — budżet Łódź";
  const bytes = Buffer.from(csv(p), "utf8");
  assert.deepEqual([...bytes.subarray(0, 3)], [0xef, 0xbb, 0xbf]);
  assert.ok(bytes.subarray(3).toString("utf8").includes(p.name));
});
