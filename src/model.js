export const colors = [
  "#25624d",
  "#77a082",
  "#bdd1b0",
  "#d9bc7b",
  "#92a9b4",
  "#c1b6ca",
  "#e0e4dc",
];
export const initialPlan = {
  id: "plan-1",
  name: "Plan marketingowy 2026",
  company: "Acme Studio",
  period: "Kwartał",
  currency: "PLN",
  budget: 120000,
  model: "E-commerce",
  goal: "Zwiększenie sprzedaży",
  industry: "Dom i lifestyle",
  stage: "Rozwój",
  brand: "Średnia",
  products: "Produkty do domu i wnętrz",
  advantage: "Design i jakość wykonania",
  cycle: 7,
  seasonality: "Wyższy popyt w IV kwartale",
  capacity: 1000,
  resources: "Zespół marketingowy, sklep internetowy, baza CRM",
  horizon: "Pierwsza transakcja",
  aov: 680,
  margin: 45,
  conversion: 2.8,
  qualified: 35,
  closeRate: 12,
  churn: 4,
  months: 12,
  incrementality: 85,
  overlap: 10,
  version: 1,
  markets: [
    {
      id: "pl",
      name: "Polska",
      language: "Polski",
      segment: "Klienci indywidualni, 25–45 lat",
      maturity: "Dojrzały",
      goal: "Zwiększenie sprzedaży",
      cpc: 3,
      conversion: 2.8,
    },
    {
      id: "de",
      name: "Niemcy",
      language: "Niemiecki",
      segment: "Klienci indywidualni, 25–45 lat",
      maturity: "Nowy",
      goal: "Wejście na rynek",
      cpc: 4.5,
      conversion: 2.1,
    },
  ],
  items: [
    {
      id: "1",
      name: "Google Ads",
      detail: "Search · kampanie produktowe",
      category: "Reklama płatna",
      market: "pl",
      amount: 42000,
      cpc: 3,
      conversion: 2.8,
      type: "Zależny od skali",
      forecast: true,
      locked: false,
      min: 0,
      max: 120000,
      scale: 50000,
    },
    {
      id: "2",
      name: "Meta Ads",
      detail: "Facebook · Instagram",
      category: "Reklama płatna",
      market: "de",
      amount: 27000,
      cpc: 4.5,
      conversion: 2.1,
      type: "Zależny od skali",
      forecast: true,
      locked: false,
      min: 0,
      max: 120000,
      scale: 40000,
    },
    {
      id: "3",
      name: "SEO i content",
      detail: "Treści · optymalizacja",
      category: "SEO i treści",
      market: "pl",
      amount: 18000,
      cpc: 3.5,
      conversion: 2.4,
      type: "Cykliczny",
      forecast: true,
      locked: false,
      min: 0,
      max: 120000,
      scale: 24000,
    },
    {
      id: "4",
      name: "E-mail i CRM",
      detail: "Automatyzacja · retencja",
      category: "CRM i retencja",
      market: "pl",
      amount: 12000,
      cpc: 1.8,
      conversion: 4.2,
      type: "Cykliczny",
      forecast: true,
      locked: false,
      min: 0,
      max: 120000,
      scale: 20000,
    },
    {
      id: "5",
      name: "Marka i PR",
      detail: "Współprace · komunikacja",
      category: "PR i marka",
      market: "de",
      amount: 9000,
      type: "Jednorazowy",
      forecast: false,
      locked: false,
      min: 0,
      max: 120000,
      scale: 20000,
    },
    {
      id: "6",
      name: "Analityka i narzędzia",
      detail: "Pomiar · raportowanie",
      category: "Badania i analityka",
      market: "pl",
      amount: 6000,
      type: "Cykliczny",
      forecast: false,
      locked: false,
      min: 0,
      max: 120000,
      scale: 10000,
    },
    {
      id: "7",
      name: "Rezerwa",
      detail: "Testy · nieprzewidziane wydatki",
      category: "Rezerwa",
      market: "pl",
      amount: 6000,
      type: "Jednorazowy",
      forecast: false,
      locked: false,
      min: 0,
      max: 120000,
      scale: 10000,
    },
  ],
};
export const money = (n, currency = "PLN", compact = false) =>
  new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
    ...(compact ? { notation: "compact" } : {}),
  }).format(Number.isFinite(n) ? n : 0);
export const percent = (n) =>
  `${new Intl.NumberFormat("pl-PL", { maximumFractionDigits: 1 }).format(Number.isFinite(n) ? n : 0)}%`;
export function forecastItem(item, plan, factor = 1) {
  if (!item.forecast) return { revenue: 0, orders: 0, clicks: 0, roi: null };
  const spend = Math.max(0, item.amount) * factor;
  const scale = Math.max(1, item.scale || 50000);
  const effective =
    spend <= scale
      ? spend
      : scale + scale * Math.log1p((spend - scale) / scale);
  const clicks = effective / Math.max(0.01, item.cpc || 3);
  let orders = (clicks * (item.conversion ?? plan.conversion)) / 100;
  if (plan.model === "B2B")
    orders *= ((plan.qualified / 100) * plan.closeRate) / 100;
  if (plan.model === "Usługi") orders *= plan.closeRate / 100;
  const horizon =
    plan.model === "Subskrypcja"
      ? Array.from(
          { length: Math.min(120, Math.max(1, plan.months)) },
          (_, i) => (1 - plan.churn / 100) ** i,
        ).reduce((a, b) => a + b, 0)
      : 1;
  const revenue =
    orders *
    plan.aov *
    horizon *
    (plan.incrementality / 100) *
    (1 - plan.overlap / 100);
  return {
    clicks,
    orders,
    revenue,
    roi: spend ? (((revenue * plan.margin) / 100 - spend) / spend) * 100 : null,
  };
}
export function forecast(plan, factor = 1) {
  const cost = plan.items.reduce((s, i) => s + i.amount, 0) * factor;
  const results = plan.items.map((i) => forecastItem(i, plan, factor));
  const revenue = results.reduce((s, i) => s + i.revenue, 0);
  const gross = (revenue * plan.margin) / 100;
  const covered =
    plan.items.filter((i) => i.forecast).reduce((s, i) => s + i.amount, 0) *
    factor;
  return {
    cost,
    revenue,
    gross,
    profit: gross - cost,
    roi: cost ? ((gross - cost) / cost) * 100 : 0,
    breakeven: plan.margin ? cost / (plan.margin / 100) : null,
    coverage: cost ? (covered / cost) * 100 : 0,
    orders: results.reduce((s, i) => s + i.orders, 0),
    roas:
      plan.items
        .filter((i) => i.category === "Reklama płatna")
        .reduce((s, i) => s + forecastItem(i, plan, factor).revenue, 0) /
      (plan.items
        .filter((i) => i.category === "Reklama płatna")
        .reduce((s, i) => s + i.amount, 0) * factor || 1),
    results,
  };
}
export function distribute(plan) {
  const locked = plan.items
    .filter((i) => i.locked)
    .reduce((s, i) => s + i.amount, 0);
  const unlocked = plan.items.filter((i) => !i.locked);
  const available = plan.budget - locked;
  const low = unlocked.reduce((s, i) => s + i.min, 0),
    high = unlocked.reduce((s, i) => s + i.max, 0);
  if (
    available < low ||
    available > high ||
    plan.items.some(
      (i) =>
        i.min > i.max || (i.locked && (i.amount < i.min || i.amount > i.max)),
    )
  )
    throw new Error(
      "Ograniczenia uniemożliwiają podział. Zmień limity min./maks., odblokuj pozycje lub zmień budżet.",
    );
  const result = plan.items.map((i) => ({
    ...i,
    amount: i.locked ? i.amount : i.min,
  }));
  let remaining = available - low;
  let active = result.filter((i) => !i.locked && i.amount < i.max);
  while (remaining > 0.001 && active.length) {
    const weights = active.reduce(
      (s, i) => s + Math.max(1, plan.items.find((x) => x.id === i.id).amount),
      0,
    );
    let used = 0;
    for (const i of active) {
      const add = Math.min(
        i.max - i.amount,
        (remaining *
          Math.max(1, plan.items.find((x) => x.id === i.id).amount)) /
          weights,
      );
      i.amount += add;
      used += add;
    }
    remaining -= used;
    active = active.filter((i) => i.amount < i.max - 0.001);
  }
  return result;
}
export function csv(plan) {
  const quote = (x) => '"' + String(x ?? "").replaceAll('"', '""') + '"';
  const metadata = [
    ["Plan", plan.name],
    ["Wersja", plan.version],
    ["Data", new Date().toISOString()],
    ["Waluta", plan.currency],
    ["Okres", plan.period],
    [
      "Horyzont",
      plan.model === "Subskrypcja" ? `${plan.months} miesięcy` : plan.horizon,
    ],
    ["Model", plan.model],
    ["Marża %", plan.margin],
    ["Wartość transakcji", plan.aov],
    ["Przyrostowość %", plan.incrementality],
    ["Nakładanie odbiorców %", plan.overlap],
    ["Leady kwalifikowane %", plan.qualified],
    ["Skuteczność sprzedaży %", plan.closeRate],
    ["Miesiące", plan.months],
    ["Rezygnacje %", plan.churn],
  ];
  const rows = [
    ...metadata,
    [],
    [
      "Rynek",
      "Kategoria",
      "Kanał",
      "Rodzaj kosztu",
      "Kwota",
      "Udział %",
      "CPC",
      "Konwersja %",
      "Limit skali",
      "Przychód",
      "ROI %",
    ],
    ...plan.items.map((i) => [
      plan.markets.find((m) => m.id === i.market)?.name,
      i.category,
      i.name,
      i.type,
      i.amount,
      plan.budget ? (i.amount / plan.budget) * 100 : 0,
      i.cpc,
      i.conversion,
      i.scale,
      i.forecast ? forecastItem(i, plan).revenue : "Nieoszacowany",
      forecastItem(i, plan).roi ?? "Nieoszacowany",
    ]),
  ];
  return "\ufeff" + rows.map((r) => r.map(quote).join(";")).join("\r\n");
}
