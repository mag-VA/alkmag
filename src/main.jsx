import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  LayoutDashboard,
  Wallet,
  Building2,
  Sparkles,
  TrendingUp,
  GitCompareArrows,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  Bell,
  Search,
  Check,
  CheckCheck,
  MoreHorizontal,
  Settings2,
  CircleHelp,
  X,
  LockKeyhole,
  LockKeyholeOpen,
  Globe2,
  Target,
  Megaphone,
  Mail,
  FileText,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Copy,
  Trash2,
  Menu,
  Save,
  CircleCheck,
  Info,
  Layers,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import {
  initialPlan,
  colors,
  money,
  percent,
  forecast,
  forecastItem,
  distribute,
  csv,
} from "./model";
import "@fontsource/dm-sans/latin-ext-400.css";
import "@fontsource/dm-sans/latin-ext-500.css";
import "@fontsource/dm-sans/latin-ext-600.css";
import "@fontsource/dm-sans/latin-ext-700.css";
import "@fontsource/manrope/latin-ext-600.css";
import "@fontsource/manrope/latin-ext-700.css";
import "@fontsource/manrope/latin-ext-800.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./styles.css";
import { api, serverEnabled } from "./api.js";
const nav = [
  ["dashboard", "Przegląd planu", LayoutDashboard],
  ["budget", "Budżet i kanały", Wallet],
  ["profile", "Profil firmy", Building2],
  ["recommendations", "Rekomendacje", Sparkles],
  ["forecast", "Prognoza wyników", TrendingUp],
  ["scenarios", "Scenariusze", GitCompareArrows],
];
const icons = [Search, Megaphone, FileText, Mail, Target, BarChart3, Layers];
function restore() {
  try {
    const data = JSON.parse(localStorage.getItem("planly-v1"));
    if (
      data?.plans?.length &&
      data.plans.every(
        (p) => Array.isArray(p.items) && Array.isArray(p.markets),
      )
    )
      return data;
  } catch {}
  return {
    plans: [structuredClone(initialPlan)],
    active: "plan-1",
    scenarios: [],
  };
}
function App() {
  const [data, setData] = useState(restore);
  const plan = data.plans.find((p) => p.id === data.active) || data.plans[0];
  const [view, setView] = useState("dashboard"),
    [modal, setModal] = useState(null),
    [toast, setToast] = useState(""),
    [menu, setMenu] = useState(null),
    [market, setMarket] = useState("all"),
    [saved, setSaved] = useState(true),
    [saveError, setSaveError] = useState(false),
    [mobile, setMobile] = useState(false),
    [scenarioFactor, setScenarioFactor] = useState(120),
    [query, setQuery] = useState("");
  const [session, setSession] = useState(null);
  const result = forecast(plan);
  const fmt = (n) => money(n, plan.currency);
  const visibleItems = plan.items.filter(
    (i) =>
      (market === "all" || i.market === market) &&
      `${i.name} ${i.category}`.toLowerCase().includes(query.toLowerCase()),
  );
  const update = (patch) => {
    if (session?.role === "reader")
      return notify(
        "Masz dostęp tylko do odczytu. Poproś właściciela o edycję.",
      );
    setSaved(false);
    setData((d) => ({
      ...d,
      plans: d.plans.map((p) =>
        p.id === plan.id
          ? { ...p, ...(typeof patch === "function" ? patch(p) : patch) }
          : p,
      ),
    }));
  };
  const notify = (message) => {
    setToast(message);
  };
  useEffect(() => {
    if (!serverEnabled) return;
    let cancelled = false;
    api("/auth/me")
      .then(async ({ user }) => {
        const workspace = await api("/workspace");
        if (!cancelled) {
          setData(workspace);
          setSession(user);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        if (session) {
          if (session.role === "reader") return;
          await api("/workspace", { method: "PUT", body: data });
        } else localStorage.setItem("planly-v1", JSON.stringify(data));
        if (!cancelled) {
          setSaved(true);
          setSaveError(false);
        }
      } catch {
        if (!cancelled) {
          setSaved(false);
          setSaveError(true);
        }
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [data, session]);
  const authenticate = async (path, values) => {
    await api("/auth/" + path, { method: "POST", body: values });
    const { user } = await api("/auth/me");
    const workspace = await api("/workspace");
    setData(workspace);
    setSession(user);
    setMarket("all");
    setModal(null);
    notify("Przestrzeń firmy została otwarta.");
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST", body: {} });
    setSession(null);
    setData(restore());
    setModal(null);
    notify("Wylogowano. Powrót do lokalnego planu demonstracyjnego.");
  };
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4200);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (!modal) return;
    const fn = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    document.addEventListener("keydown", fn);
    const previous = document.activeElement;
    const t = setTimeout(
      () => document.querySelector(".dialog input, .dialog button")?.focus(),
      0,
    );
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", fn);
      previous?.focus();
    };
  }, [modal]);
  const exportCSV = () => {
    const blob = new Blob([csv(plan)], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${plan.name}-v${plan.version}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMenu(null);
    notify("Raport CSV został wyeksportowany.");
  };
  const newPlan = (values) => {
    if (session?.role === "reader")
      return notify("Masz dostęp tylko do odczytu.");
    const id = crypto.randomUUID();
    const p = { ...structuredClone(initialPlan), ...values, id, version: 1 };
    p.items = p.items.map((i) => ({
      ...i,
      amount: (i.amount / 120000) * p.budget,
      max: p.budget,
    }));
    setData((d) => ({ ...d, plans: [...d.plans, p], active: id }));
    setModal(null);
    setMarket("all");
    setView("dashboard");
    notify("Nowy plan jest gotowy.");
  };
  const saveScenario = (name, factor = 1) => {
    if (session?.role === "reader")
      return notify("Masz dostęp tylko do odczytu.");
    const p = structuredClone(plan);
    p.items = p.items.map((i) => ({ ...i, amount: i.amount * factor }));
    p.budget *= factor;
    setData((d) => ({
      ...d,
      scenarios: [
        ...d.scenarios,
        {
          id: crypto.randomUUID(),
          name,
          plan: p,
          date: new Date().toISOString(),
          source: plan.id,
        },
      ],
    }));
    notify("Scenariusz zapisany wraz z założeniami.");
  };
  const remaining = plan.budget - result.cost;
  const setItem = (id, patch) =>
    update((p) => ({
      items: p.items.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? "mobile-open" : ""}`}>
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setView("dashboard");
          }}
        >
          <span className="brand-symbol">
            <BarChart3 size={24} />
          </span>
          planly<span className="brand-dot">.</span>
        </a>
        <div className="workspace">
          <span className="company-mark">A</span>
          <div>
            <strong>{plan.company}</strong>
            <small>Przestrzeń robocza</small>
          </div>
          <button
            className="icon-button"
            aria-label="Ustawienia firmy"
            onClick={() => {
              setView("profile");
              setMobile(false);
            }}
          >
            <ChevronDown size={16} />
          </button>
        </div>
        <span className="nav-label">TWOJE PLANOWANIE</span>
        <nav>
          {nav.map(([key, label, Icon]) => (
            <button
              key={key}
              className={view === key ? "nav-item active" : "nav-item"}
              onClick={() => {
                setView(key);
                setMobile(false);
                setMenu(null);
              }}
            >
              <Icon size={19} />
              <span>{label}</span>
              {key === "recommendations" && (
                <span className="nav-badge">4</span>
              )}
            </button>
          ))}
        </nav>
        <button
          className="nav-item plans-link"
          onClick={() => {
            setView("plans");
            setMobile(false);
          }}
        >
          <Layers size={19} />
          Wszystkie plany
          <ChevronRight size={15} />
        </button>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <Sparkles size={20} />
            </span>
            <strong>Dobry plan to początek.</strong>
            <p>Sprawdź, jak przełożyć budżet na realne rezultaty.</p>
            <button onClick={() => setModal({ type: "help" })}>
              Poznaj przewodnik <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className="nav-item"
            onClick={() => setModal({ type: "settings" })}
          >
            <Settings2 size={18} />
            Ustawienia
          </button>
          <button
            className="user-button"
            onClick={() => setModal({ type: "account" })}
          >
            <span className="avatar">MK</span>
            <span>
              <strong>{session?.name || "Moje konto"}</strong>
              <small>
                {session
                  ? {
                      owner: "Właściciel",
                      editor: "Edytor",
                      reader: "Dostęp do odczytu",
                    }[session.role]
                  : "Przestrzeń lokalna"}
              </small>
            </span>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-toggle"
              aria-label="Otwórz nawigację"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={22} />
            </button>
            <span>Plany marketingowe</span>
            <ChevronRight size={14} />
            <strong>{plan.name}</strong>
          </div>
          <div className="top-actions">
            <span className={`save-status ${saveError ? "error" : ""}`}>
              <CheckCheck size={16} />
              {saveError
                ? "Błąd zapisu — ponów zmianę"
                : session?.role === "reader"
                  ? "Dostęp tylko do odczytu"
                  : saved
                    ? "Wszystkie zmiany zapisane"
                    : "Zapisywanie…"}
            </span>
            <button
              className="icon-button notification"
              aria-label="Powiadomienia"
              onClick={() =>
                setMenu(menu === "notifications" ? null : "notifications")
              }
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar small">MK</span>
            {menu === "notifications" && (
              <div className="dropdown notification-menu">
                <strong>Jesteś na bieżąco</strong>
                <p>
                  {session
                    ? "Twój plan jest zapisywany w przestrzeni firmy na serwerze."
                    : "Twój plan jest zapisywany automatycznie w tej przeglądarce."}
                </p>
                <span className="muted">Brak nowych powiadomień</span>
              </div>
            )}
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-dot" /> TWOJA STRATEGIA, W LICZBACH
              </div>
              <h1>
                {view === "dashboard"
                  ? "Przegląd planu"
                  : view === "plans"
                    ? "Twoje plany"
                    : nav.find((n) => n[0] === view)?.[1]}
              </h1>
              <p>
                {
                  {
                    dashboard:
                      "Zaplanuj wydatki. Zrozum potencjał. Podejmuj lepsze decyzje.",
                    budget:
                      "Każda złotówka ma swoje miejsce. Dopasuj podział do swoich celów.",
                    profile:
                      "Dobre rekomendacje zaczynają się od poznania Twojej firmy.",
                    recommendations:
                      "Przejrzyste wskazówki dopasowane do Twojego modelu biznesowego.",
                    forecast:
                      "Sprawdź, co może przynieść Twój budżet i na jakich założeniach.",
                    scenarios:
                      "Sprawdź różne możliwości, zanim podejmiesz decyzję.",
                    plans: "Wszystkie strategie i budżety w jednym miejscu.",
                  }[view]
                }
              </p>
            </div>
            <div className="heading-actions">
              <div className="relative">
                <button
                  className="button"
                  onClick={() => setMenu(menu === "export" ? null : "export")}
                >
                  <Download size={16} />
                  Eksportuj
                  <ChevronDown size={14} />
                </button>
                {menu === "export" && (
                  <div className="dropdown">
                    <button onClick={exportCSV}>
                      <FileText size={16} />
                      Pobierz CSV
                    </button>
                    <button
                      onClick={() => {
                        setMenu(null);
                        window.print();
                      }}
                    >
                      <FileText size={16} />
                      Raport PDF / drukuj
                    </button>
                  </div>
                )}
              </div>
              <button
                className="button primary"
                onClick={() => setModal({ type: "newplan" })}
              >
                <Plus size={17} />
                Nowy plan
              </button>
            </div>
          </div>
          {view !== "plans" && (
            <div className="plan-toolbar">
              <div className="relative">
                <button
                  className="plan-select"
                  onClick={() => setMenu(menu === "plans" ? null : "plans")}
                >
                  <span className="plan-icon">
                    <FileText size={18} />
                  </span>
                  <strong>{plan.name}</strong>
                  <span className="tag">Wersja {plan.version}</span>
                  <ChevronDown size={15} />
                </button>
                {menu === "plans" && (
                  <div className="dropdown plan-dropdown">
                    {data.plans.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setData((d) => ({ ...d, active: p.id }));
                          setMarket("all");
                          setMenu(null);
                        }}
                      >
                        {p.name}
                        {p.id === plan.id && <Check size={15} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="toolbar-filters">
                <button
                  className="text-button"
                  onClick={() => setModal({ type: "plan" })}
                >
                  <span className="period-dot" />
                  {plan.period === "Kwartał"
                    ? "IV kwartał 2026"
                    : plan.period === "Miesiąc"
                      ? "Październik 2026"
                      : "Rok 2026"}
                  <ChevronDown size={14} />
                </button>
                <span className="divider" />
                <select
                  className="market-select"
                  aria-label="Wybierz rynek"
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                >
                  <option value="all">Wszystkie rynki</option>
                  {plan.markets.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="currency-chip">{plan.currency}</span>
              </div>
            </div>
          )}
          {view === "dashboard" && (
            <>
              <div className="kpi-grid">
                <Kpi
                  label="Całkowity budżet"
                  value={fmt(plan.budget)}
                  icon={Wallet}
                  foot={
                    <>
                      <span className="tiny-dot" /> {plan.items.length} pozycji
                      · {plan.markets.length} rynki
                    </>
                  }
                  onClick={() => setModal({ type: "plan" })}
                />
                <Kpi
                  label="Prognozowany przychód"
                  value={fmt(result.revenue)}
                  icon={TrendingUp}
                  foot={
                    <>
                      <span className="green-text">
                        {fmt(result.revenue * 0.75)} –{" "}
                        {fmt(result.revenue * 1.25)}
                      </span>
                      <Info size={13} />
                    </>
                  }
                />
                <Kpi
                  label="Prognozowany ROI"
                  value={percent(result.roi)}
                  icon={ArrowUpRight}
                  highlight
                  foot={
                    <>
                      <span className="positive-pill">
                        {result.roi >= 0 ? "Dodatni" : "Ujemny"} zwrot
                      </span>
                      <span>Po kosztach marketingu</span>
                    </>
                  }
                />
                <Kpi
                  label="Próg rentowności"
                  value={
                    result.breakeven === null
                      ? "Nieoszacowany"
                      : fmt(result.breakeven)
                  }
                  icon={Target}
                  foot={
                    <>
                      <span>Wymagany przychód przyrostowy</span>
                      <Info size={13} />
                    </>
                  }
                />
              </div>
              <div className="analysis-grid">
                <section className="card forecast-card">
                  <div className="card-heading">
                    <div>
                      <h2>
                        Potencjał Twojego planu{" "}
                        <span className="soft-tag">Prognoza</span>
                      </h2>
                      <p>Jak budżet przekłada się na oczekiwane wyniki</p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Edytuj założenia prognozy"
                      onClick={() => setModal({ type: "assumptions" })}
                    >
                      <SlidersHorizontal size={18} />
                    </button>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-line" />
                      Przychód przyrostowy
                    </span>
                    <span>
                      <i className="legend-line light" />
                      Koszt marketingu
                    </span>
                    <span className="legend-range">
                      <i />
                      Zakres prognozy
                    </span>
                  </div>
                  <RevenueChart plan={plan} result={result} />
                  <div className="chart-footer">
                    <span>
                      <ShieldCheck size={16} />
                      <strong>Umiarkowana pewność</strong>
                      <span className="desktop-text">
                        · Model oparty na założeniach
                      </span>
                    </span>
                    <button
                      className="link-button"
                      onClick={() => setView("forecast")}
                    >
                      Zobacz prognozę
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </section>
                <section className="card allocation-card">
                  <div className="card-heading">
                    <div>
                      <h2>Podział budżetu</h2>
                      <p>
                        {market === "all"
                          ? "Wszystkie rynki"
                          : plan.markets.find((m) => m.id === market)
                              ?.name}{" "}
                        · {plan.currency}
                      </p>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Edytuj podział budżetu"
                      onClick={() => setView("budget")}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                  </div>
                  <Donut items={visibleItems} currency={plan.currency} />
                  <div className="allocation-legend">
                    {visibleItems.map((i) => (
                      <div key={i.id}>
                        <span>
                          <i
                            style={{
                              background:
                                colors[plan.items.indexOf(i) % colors.length],
                            }}
                          />
                          {i.category === "Reklama płatna"
                            ? i.name
                            : i.category}
                        </span>
                        <strong>
                          {percent(
                            plan.budget ? (i.amount / plan.budget) * 100 : 0,
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                  <button
                    className="full-link"
                    onClick={() => setView("budget")}
                  >
                    Edytuj podział budżetu
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <div className="bottom-grid">
                <section className="card budget-card">
                  <div className="card-heading">
                    <div>
                      <h2>Twój budżet w szczegółach</h2>
                      <p>Wydatki i przewidywane efekty według kanałów</p>
                    </div>
                    <button
                      className="link-button"
                      onClick={() => setView("budget")}
                    >
                      Zobacz wszystko
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <BudgetTable
                    items={visibleItems.slice(0, 4)}
                    plan={plan}
                    onEdit={(item) => setModal({ type: "item", item })}
                  />
                  <div className="table-footer">
                    <span>
                      <CircleCheck size={15} />
                      {Math.abs(remaining) < 0.01
                        ? "Budżet rozdzielony w 100%"
                        : `${remaining >= 0 ? "Nieprzydzielone" : "Przekroczenie"}: ${fmt(Math.abs(remaining))}`}
                    </span>
                    <strong>
                      Łącznie <span>{fmt(result.cost)}</span>
                    </strong>
                  </div>
                </section>
                <section className="recommendation-teaser">
                  <div className="recommendation-head">
                    <span className="sparkle-box">
                      <Sparkles size={20} />
                    </span>
                    <span>Wskazówka dla Twojego planu</span>
                    <span className="new-tag">NOWE</span>
                  </div>
                  <h2>
                    Wykorzystaj potencjał <br />
                    obecnych klientów.
                  </h2>
                  <p>
                    E-mail i automatyzacja mogą wspierać sprzedaż przy niższym
                    koszcie dotarcia. Zacznij od segmentacji swojej bazy.
                  </p>
                  <div className="tip-tags">
                    <span>
                      <Mail size={14} />
                      CRM i retencja
                    </span>
                    <span>Horyzont: 1–3 mies.</span>
                  </div>
                  <button onClick={() => setView("recommendations")}>
                    Sprawdź rekomendacje
                    <ArrowUpRight size={17} />
                  </button>
                </section>
              </div>
              <div className="disclaimer">
                <Info size={15} />
                <span>
                  Prognozy to oszacowania, nie gwarancja wyników.{" "}
                  {percent(result.coverage)} wydatków objęto prognozą finansową.
                </span>
                <button onClick={() => setModal({ type: "assumptions" })}>
                  Poznaj założenia
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </>
          )}
          {view === "budget" && (
            <>
              <div className="budget-summary">
                <div>
                  <span className="muted">Przydzielony budżet</span>
                  <h2>
                    {fmt(result.cost)} <small>/ {fmt(plan.budget)}</small>
                  </h2>
                  <div className="progress">
                    <span
                      style={{
                        width: `${Math.min(100, plan.budget ? (result.cost / plan.budget) * 100 : 0)}%`,
                      }}
                    />
                  </div>
                </div>
                <div
                  className={remaining < 0 ? "remaining error" : "remaining"}
                >
                  <span>
                    {remaining < 0
                      ? "Przekroczenie budżetu"
                      : "Nieprzydzielone środki"}
                  </span>
                  <strong>{fmt(Math.abs(remaining))}</strong>
                </div>
                <button
                  className="button"
                  onClick={() => {
                    try {
                      update({ items: distribute(plan) });
                      notify(
                        "Budżet rozdzielony. Zablokowane pozycje zachowano.",
                      );
                    } catch (e) {
                      notify(e.message);
                    }
                  }}
                >
                  <Sparkles size={16} />
                  Rozdziel automatycznie
                </button>
                <button
                  className="button"
                  onClick={() => {
                    const i = plan.items.find(
                      (i) => i.category === "Rezerwa" && !i.locked,
                    );
                    if (remaining <= 0)
                      return notify("Brak dodatnich środków do przeniesienia.");
                    if (!i)
                      return notify("Dodaj lub odblokuj pozycję Rezerwa.");
                    if (i.amount + remaining > i.max)
                      return notify("Zwiększ maksymalny limit rezerwy.");
                    setItem(i.id, { amount: i.amount + remaining });
                    notify("Pozostałe środki przeniesiono do rezerwy.");
                  }}
                >
                  Do rezerwy
                  <ArrowRight size={15} />
                </button>
              </div>
              <section className="card">
                <div className="card-heading">
                  <div>
                    <h2>Kanały i pozycje kosztowe</h2>
                    <p>
                      Edytuj kwoty i udziały. Kłódka chroni pozycję podczas
                      automatycznego podziału.
                    </p>
                  </div>
                  <button
                    className="button primary"
                    onClick={() => setModal({ type: "item", item: null })}
                  >
                    <Plus size={16} />
                    Dodaj pozycję
                  </button>
                </div>
                {plan.items.some(
                  (i) => i.amount < i.min || i.amount > i.max,
                ) && (
                  <div className="constraint-warning" role="alert">
                    <Info size={17} />
                    <span>
                      Kwoty poza limitami:{" "}
                      {plan.items
                        .filter((i) => i.amount < i.min || i.amount > i.max)
                        .map((i) => i.name)
                        .join(", ")}
                      . Dopasuj kwoty lub limity w ustawieniach pozycji.
                    </span>
                  </div>
                )}
                <div className="table-tools">
                  <Search size={16} />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Szukaj kanału lub kategorii…"
                    aria-label="Szukaj kanału"
                  />
                  <span>{visibleItems.length} pozycji</span>
                </div>
                <BudgetTable
                  items={visibleItems}
                  plan={plan}
                  editable
                  onEdit={(item) => setModal({ type: "item", item })}
                  setItem={setItem}
                />
                {!visibleItems.length && (
                  <div className="empty">
                    Brak pozycji pasujących do filtrów.
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    Kwoty w {plan.currency} · udziały względem całego planu
                  </span>
                  <button
                    className="link-button"
                    onClick={() => {
                      saveScenario(`Wersja ${plan.version}`);
                      update({ version: plan.version + 1 });
                      notify("Zapisano wersję planu w scenariuszach.");
                    }}
                  >
                    <Save size={15} />
                    Zapisz wersję
                  </button>
                </div>
              </section>
            </>
          )}
          {view === "profile" && (
            <Profile plan={plan} update={update} notify={notify} />
          )}
          {view === "recommendations" && (
            <Recommendations plan={plan} setView={setView} />
          )}
          {view === "forecast" && (
            <>
              <div className="kpi-grid">
                <Kpi
                  label="Przychód przyrostowy"
                  value={fmt(result.revenue)}
                  icon={TrendingUp}
                  foot="Po korekcie przypisania wyników"
                />
                <Kpi
                  label="Marża przed marketingiem"
                  value={fmt(result.gross)}
                  icon={Wallet}
                  foot={`Marża: ${percent(plan.margin)}`}
                />
                <Kpi
                  label="Wynik po marketingu"
                  value={fmt(result.profit)}
                  icon={BarChart3}
                  highlight
                  foot={`ROI: ${percent(result.roi)}`}
                />
                <Kpi
                  label="Pokrycie prognozą"
                  value={percent(result.coverage)}
                  icon={ShieldCheck}
                  foot="Udział kosztów z prognozą finansową"
                />
              </div>
              <div className="analysis-grid forecast-view">
                <section className="card">
                  <div className="card-heading">
                    <div>
                      <h2>Przychód i koszty w czasie</h2>
                      <p>
                        {plan.model === "Subskrypcja"
                          ? `${plan.months} miesięcy`
                          : plan.horizon}{" "}
                        · {plan.period.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <RevenueChart plan={plan} result={result} />
                  <div className="chart-footer">
                    <span>
                      Zakres: {fmt(result.revenue * 0.75)} –{" "}
                      {fmt(result.revenue * 1.25)}
                    </span>
                  </div>
                </section>
                <section className="card assumptions-panel">
                  <h2>Założenia prognozy</h2>
                  <p className="muted">Zmiany od razu przeliczają wyniki.</p>
                  <Field label="Średnia wartość transakcji">
                    <input
                      type="number"
                      min="0"
                      value={plan.aov}
                      onChange={(e) =>
                        update({ aov: Math.max(0, +e.target.value) })
                      }
                    />
                  </Field>
                  <Field label="Marża (%)">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={plan.margin}
                      onChange={(e) =>
                        update({
                          margin: Math.min(100, Math.max(0, +e.target.value)),
                        })
                      }
                    />
                  </Field>
                  <Field label="Przyrostowość (%)">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={plan.incrementality}
                      onChange={(e) =>
                        update({
                          incrementality: Math.min(
                            100,
                            Math.max(0, +e.target.value),
                          ),
                        })
                      }
                    />
                  </Field>
                  <button
                    className="link-button"
                    onClick={() => setModal({ type: "assumptions" })}
                  >
                    Wszystkie parametry
                    <ArrowRight size={15} />
                  </button>
                </section>
              </div>
              <section className="card">
                <div className="card-heading">
                  <div>
                    <h2>Wyniki według kanałów</h2>
                    <p>
                      ROI = (przychód × marża − koszt marketingu) / koszt
                      marketingu. ROAS reklam: {result.roas.toFixed(2)}×.
                    </p>
                  </div>
                </div>
                <BudgetTable
                  items={visibleItems}
                  plan={plan}
                  forecastMode
                  onEdit={(item) => setModal({ type: "item", item })}
                />
                <div className="table-footer">
                  <Info size={15} />
                  <span>
                    Koszty bez oszacowanego ROI są uwzględnione w wyniku
                    całkowitym. Pewność: umiarkowana; źródło: ręczne założenia.
                  </span>
                </div>
              </section>
            </>
          )}
          {view === "scenarios" && (
            <>
              <section className="card sensitivity">
                <div>
                  <span className="eyebrow">CO, JEŚLI…</span>
                  <h2>Zmienisz skalę inwestycji?</h2>
                  <p>
                    Model uwzględnia malejącą efektywność powyżej limitu skali
                    kanału.
                  </p>
                  <label className="range-label" htmlFor="scale">
                    Budżet:{" "}
                    <strong>{fmt((plan.budget * scenarioFactor) / 100)}</strong>
                    <span>{scenarioFactor}% planu</span>
                  </label>
                  <input
                    id="scale"
                    type="range"
                    min="50"
                    max="200"
                    step="5"
                    value={scenarioFactor}
                    onChange={(e) => setScenarioFactor(+e.target.value)}
                  />
                  <div className="range-ticks">
                    <span>50%</span>
                    <span>100%</span>
                    <span>150%</span>
                    <span>200%</span>
                  </div>
                </div>
                <div className="scenario-result">
                  <span>Prognozowany przychód</span>
                  <strong>
                    {fmt(forecast(plan, scenarioFactor / 100).revenue)}
                  </strong>
                  <span>
                    ROI{" "}
                    <b>{percent(forecast(plan, scenarioFactor / 100).roi)}</b>
                  </span>
                  <button
                    className="button primary"
                    onClick={() =>
                      saveScenario(
                        `Budżet ${scenarioFactor}%`,
                        scenarioFactor / 100,
                      )
                    }
                  >
                    <Plus size={16} />
                    Zapisz scenariusz
                  </button>
                </div>
              </section>
              <div className="section-title">
                <h2>Porównaj scenariusze</h2>
                <button
                  className="button"
                  onClick={() => setModal({ type: "scenario" })}
                >
                  <Copy size={16} />
                  Kopiuj obecny plan
                </button>
              </div>
              <div className="scenario-grid">
                <ScenarioCard name="Bieżący plan" plan={plan} base />
                <>
                  {data.scenarios
                    .filter((s) => s.source === plan.id)
                    .map((s) => (
                      <ScenarioCard
                        key={s.id}
                        name={s.name}
                        plan={s.plan}
                        onDelete={() =>
                          setData((d) => ({
                            ...d,
                            scenarios: d.scenarios.filter((x) => x.id !== s.id),
                          }))
                        }
                        onApply={() => {
                          update({
                            ...structuredClone(s.plan),
                            id: plan.id,
                            version: plan.version + 1,
                          });
                          notify("Scenariusz zastosowano do bieżącego planu.");
                        }}
                        onExport={() => {
                          const blob = new Blob([csv(s.plan)], {
                            type: "text/csv;charset=utf-8;",
                          });
                          const u = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = u;
                          a.download = `${s.name}.csv`;
                          a.click();
                          URL.revokeObjectURL(u);
                        }}
                      />
                    ))}
                </>
              </div>
              {!data.scenarios.filter((s) => s.source === plan.id).length && (
                <div className="empty card">
                  <GitCompareArrows size={28} />
                  <h3>Jedna strategia, wiele możliwości</h3>
                  <p>
                    Zapisz pierwszy wariant za pomocą suwaka lub skopiuj obecny
                    plan.
                  </p>
                  <button
                    className="button"
                    onClick={() => {
                      saveScenario("Ostrożny", 0.8);
                      saveScenario("Rozwojowy", 1.3);
                    }}
                  >
                    Utwórz dwa warianty
                  </button>
                </div>
              )}
            </>
          )}
          {view === "plans" && (
            <div className="plans-grid">
              {data.plans.map((p) => (
                <button
                  key={p.id}
                  className="card plan-card"
                  onClick={() => {
                    setData((d) => ({ ...d, active: p.id }));
                    setMarket("all");
                    setView("dashboard");
                  }}
                >
                  <span className="plan-card-icon">
                    <FileText size={24} />
                  </span>
                  <span className="tag">Wersja {p.version}</span>
                  <h2>{p.name}</h2>
                  <p>
                    {p.company} · {p.period} · {p.markets.length} rynki
                  </p>
                  <strong>{money(p.budget, p.currency)}</strong>
                  <span className="plan-card-footer">
                    Otwórz plan
                    <ArrowRight size={18} />
                  </span>
                </button>
              ))}
              <button
                className="new-plan-card"
                onClick={() => setModal({ type: "newplan" })}
              >
                <Plus size={28} />
                <strong>Nowy plan marketingowy</strong>
                <span>Zamień cele w konkretny budżet.</span>
              </button>
            </div>
          )}
          <footer className="page-footer">
            <span>
              planly<span className="green-text">.</span>{" "}
              <span>Przemyślane budżety. Lepsze decyzje.</span>
            </span>
            <button onClick={() => setModal({ type: "help" })}>
              <CircleHelp size={14} />
              Centrum pomocy
            </button>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CircleCheck size={20} />
          {toast}
          <button
            className="icon-button"
            aria-label="Zamknij komunikat"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <Modal
          modal={modal}
          plan={plan}
          session={session}
          onAuth={authenticate}
          onLogout={logout}
          onClose={() => setModal(null)}
          onSave={(values) => {
            if (modal.type === "newplan") return newPlan(values);
            if (modal.type === "scenario") {
              saveScenario(values.name);
              setModal(null);
              return;
            }
            if (modal.type === "item") {
              if (modal.item) setItem(modal.item.id, values);
              else
                update({
                  items: [
                    ...plan.items,
                    { ...values, id: crypto.randomUUID(), locked: false },
                  ],
                });
            } else update(values);
            setModal(null);
            notify("Zmiany zostały zapisane.");
          }}
          onDelete={() => {
            update({ items: plan.items.filter((i) => i.id !== modal.item.id) });
            setModal(null);
            notify("Pozycja usunięta.");
          }}
        />
      )}
      <PrintReport plan={plan} result={result} />
    </div>
  );
}
function Kpi({ label, value, icon: Icon, foot, highlight, onClick }) {
  return (
    <section className={`kpi ${highlight ? "highlight" : ""}`}>
      <div className="kpi-label">
        <span>{label}</span>
        <span className="kpi-icon">
          <Icon size={17} />
        </span>
      </div>
      <div className="kpi-value">
        {value}
        {onClick && (
          <button
            aria-label="Edytuj budżet"
            className="icon-button"
            onClick={onClick}
          >
            <Settings2 size={15} />
          </button>
        )}
      </div>
      <div className="kpi-foot">{foot}</div>
    </section>
  );
}
function RevenueChart({ plan, result }) {
  const [hover, setHover] = useState(null);
  const steps = plan.period === "Rok" ? 12 : plan.period === "Miesiąc" ? 4 : 3;
  const labels =
    plan.period === "Rok"
      ? [
          "Sty",
          "Lut",
          "Mar",
          "Kwi",
          "Maj",
          "Cze",
          "Lip",
          "Sie",
          "Wrz",
          "Paź",
          "Lis",
          "Gru",
        ]
      : plan.period === "Miesiąc"
        ? ["Tydz. 1", "Tydz. 2", "Tydz. 3", "Tydz. 4"]
        : ["Październik", "Listopad", "Grudzień"];
  const max = Math.max(result.revenue * 1.28, result.cost * 1.2, 1);
  const y = (v) => 174 - (v / max) * 150;
  const x = (i) => 64 + (i * 526) / (steps - 1);
  const values = Array.from(
    { length: steps },
    (_, i) => (result.revenue * (i + 1)) / steps,
  );
  const costs = Array.from(
    { length: steps },
    (_, i) => (result.cost * (i + 1)) / steps,
  );
  const path = (vs) =>
    vs.map((v, i) => `${i ? "L" : "M"} ${x(i)} ${y(v)}`).join(" ");
  const area =
    path(values.map((v) => v * 1.25)) +
    " " +
    values
      .map((_, j) => {
        const i = steps - 1 - j;
        return `L ${x(i)} ${y(values[i] * 0.75)}`;
      })
      .join(" ") +
    " Z";
  return (
    <div className="revenue-chart">
      <svg
        viewBox="0 0 640 214"
        role="img"
        aria-label="Skumulowana prognoza przychodu i kosztów w okresie planu"
      >
        <defs>
          <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b2ccb8" stopOpacity=".42" />
            <stop offset="100%" stopColor="#b2ccb8" stopOpacity=".04" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <g key={t}>
            <line
              x1="64"
              x2="605"
              y1={y(max * t)}
              y2={y(max * t)}
              stroke="#e9ece7"
              strokeDasharray="3 4"
            />
            <text
              x="49"
              y={y(max * t) + 4}
              textAnchor="end"
              className="chart-label"
            >
              {money(max * t, plan.currency, true)}
            </text>
          </g>
        ))}
        <path d={area} fill="url(#chart-fill)" />
        <path
          d={path(costs)}
          fill="none"
          stroke="#b7c8a9"
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <path
          d={path(values)}
          fill="none"
          stroke="#296348"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {values.map((v, i) => (
          <g
            key={i}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            tabIndex="0"
            aria-label={`${labels[i]}: ${money(v, plan.currency)}`}
          >
            <circle
              cx={x(i)}
              cy={y(v)}
              r="5"
              fill="#296348"
              stroke="white"
              strokeWidth="2"
            />
            <circle cx={x(i)} cy={y(v)} r="15" fill="transparent" />
            <text x={x(i)} y="205" textAnchor="middle" className="chart-label">
              {labels[i]}
            </text>
          </g>
        ))}
        {hover !== null && (
          <g>
            <rect
              x={Math.min(462, Math.max(65, x(hover) - 65))}
              y={Math.max(0, y(values[hover]) - 40)}
              width="130"
              height="29"
              rx="6"
              fill="#194d40"
            />
            <text
              x={Math.min(527, Math.max(130, x(hover)))}
              y={Math.max(18, y(values[hover]) - 21)}
              textAnchor="middle"
              fill="white"
              fontSize="11"
            >
              {money(values[hover], plan.currency)}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
function Donut({ items, currency }) {
  const total = items.reduce((s, i) => s + i.amount, 0);
  let offset = 0;
  return (
    <div className="donut-wrap">
      <svg
        viewBox="0 0 200 200"
        role="img"
        aria-label="Podział budżetu według kanałów"
      >
        <circle
          cx="100"
          cy="100"
          r="76"
          fill="none"
          stroke="#edf0e9"
          strokeWidth="23"
        />
        {items.map((i, n) => {
          const fraction = total ? i.amount / total : 0;
          const dash = fraction * 477.522;
          const start = offset;
          offset += dash;
          return (
            <circle
              key={i.id}
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke={
                colors[
                  Number(i.id) - 1 >= 0
                    ? (Number(i.id) - 1) % colors.length
                    : n % colors.length
                ]
              }
              strokeWidth="23"
              strokeDasharray={`${Math.max(0, dash - 3)} ${477.522 - Math.max(0, dash - 3)}`}
              strokeDashoffset={-start}
              transform="rotate(-90 100 100)"
            >
              <title>
                {i.name}: {money(i.amount, currency)}
              </title>
            </circle>
          );
        })}
      </svg>
      <div className="donut-center">
        <span>Łączny budżet</span>
        <strong>{money(total, currency)}</strong>
        <small>{items.length} kanałów</small>
      </div>
    </div>
  );
}
function BudgetTable({ items, plan, onEdit, editable, setItem, forecastMode }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>KANAŁ / KATEGORIA</th>
            {editable && <th>RYNEK</th>}
            <th>BUDŻET</th>
            <th>UDZIAŁ</th>
            {editable && <th>UDZIAŁ RYNKU</th>}
            <th>{forecastMode ? "PRZYCHÓD" : "PROGNOZA ROI"}</th>
            {forecastMode && (
              <>
                <th>TRANSAKCJE</th>
                <th>ROI</th>
              </>
            )}
            <th>
              <span className="sr-only">Akcje</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => {
            const Icon = icons[plan.items.indexOf(i) % icons.length];
            const f = forecastItem(i, plan);
            const marketTotal = plan.items
              .filter((x) => x.market === i.market)
              .reduce((s, x) => s + x.amount, 0);
            return (
              <tr key={i.id}>
                <td>
                  <button className="channel-button" onClick={() => onEdit(i)}>
                    <span
                      className="channel-icon"
                      style={{
                        background:
                          colors[plan.items.indexOf(i) % colors.length] + "18",
                        color: colors[plan.items.indexOf(i) % colors.length],
                      }}
                    >
                      <Icon size={18} />
                    </span>
                    <span>
                      <strong>{i.name}</strong>
                      <small>{i.detail || i.category}</small>
                    </span>
                  </button>
                </td>
                {editable && (
                  <td>
                    <span className="market-tag">
                      {plan.markets.find((m) => m.id === i.market)?.name}
                    </span>
                  </td>
                )}
                <td>
                  {editable ? (
                    <div className="amount-input">
                      <input
                        type="number"
                        aria-label={`Budżet ${i.name}`}
                        min="0"
                        step="100"
                        value={Math.round(i.amount * 100) / 100}
                        onChange={(e) =>
                          setItem(i.id, {
                            amount: Math.max(0, +e.target.value),
                          })
                        }
                      />
                      <small>{plan.currency}</small>
                    </div>
                  ) : (
                    <strong className="table-amount">
                      {money(i.amount, plan.currency)}
                    </strong>
                  )}
                </td>
                <td>
                  {editable ? (
                    <div className="percent-input">
                      <input
                        type="number"
                        aria-label={`Udział ${i.name}`}
                        min="0"
                        step=".1"
                        value={
                          Math.round(
                            (plan.budget ? (i.amount / plan.budget) * 100 : 0) *
                              100,
                          ) / 100
                        }
                        onChange={(e) =>
                          setItem(i.id, {
                            amount:
                              (Math.max(0, +e.target.value) * plan.budget) /
                              100,
                          })
                        }
                      />
                      <small>%</small>
                    </div>
                  ) : (
                    <span>
                      {percent(
                        plan.budget ? (i.amount / plan.budget) * 100 : 0,
                      )}
                    </span>
                  )}
                </td>
                {editable && (
                  <td>
                    {percent(marketTotal ? (i.amount / marketTotal) * 100 : 0)}
                  </td>
                )}
                <td>
                  {forecastMode ? (
                    i.forecast ? (
                      money(f.revenue, plan.currency)
                    ) : (
                      <span className="muted">Nieoszacowany</span>
                    )
                  ) : f.roi !== null ? (
                    <span className={`roi-chip ${f.roi < 0 ? "negative" : ""}`}>
                      {f.roi >= 0 ? "+" : ""}
                      {percent(f.roi)}
                    </span>
                  ) : (
                    <span className="muted">Nieoszacowany</span>
                  )}
                </td>
                {forecastMode && (
                  <>
                    <td>
                      {i.forecast
                        ? new Intl.NumberFormat("pl-PL", {
                            maximumFractionDigits: 1,
                          }).format(f.orders)
                        : "—"}
                    </td>
                    <td>{f.roi === null ? "Nieoszacowany" : percent(f.roi)}</td>
                  </>
                )}
                <td>
                  {editable ? (
                    <button
                      className={`icon-button ${i.locked ? "locked" : ""}`}
                      aria-label={`${i.locked ? "Odblokuj" : "Zablokuj"} ${i.name}`}
                      onClick={() => setItem(i.id, { locked: !i.locked })}
                    >
                      {i.locked ? (
                        <LockKeyhole size={16} />
                      ) : (
                        <LockKeyholeOpen size={16} />
                      )}
                    </button>
                  ) : (
                    <button
                      className="icon-button"
                      aria-label={`Edytuj ${i.name}`}
                      onClick={() => onEdit(i)}
                    >
                      <ChevronRight size={15} />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Profile({ plan, update, notify }) {
  const [draft, setDraft] = useState(structuredClone(plan));
  useEffect(() => setDraft(structuredClone(plan)), [plan.id]);
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        update(draft);
        notify("Profil firmy i rynki zapisane.");
      }}
    >
      <div className="profile-grid">
        <section className="card form-card">
          <div className="section-icon">
            <Building2 size={21} />
          </div>
          <h2>Poznajmy Twoją firmę</h2>
          <p className="muted">
            Te informacje pomagają dopasować rekomendacje.
          </p>
          <div className="form-grid">
            <Field label="Nazwa firmy">
              <input
                required
                value={draft.company}
                onChange={(e) => set("company", e.target.value)}
              />
            </Field>
            <Field label="Branża">
              <input
                value={draft.industry}
                onChange={(e) => set("industry", e.target.value)}
              />
            </Field>
            <Field label="Model biznesowy">
              <select
                value={draft.model}
                onChange={(e) => set("model", e.target.value)}
              >
                {["E-commerce", "B2B", "B2C", "Usługi", "Subskrypcja"].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Główny cel">
              <select
                value={draft.goal}
                onChange={(e) => set("goal", e.target.value)}
              >
                {[
                  "Zwiększenie sprzedaży",
                  "Pozyskanie leadów",
                  "Wejście na rynek",
                  "Retencja",
                  "Świadomość marki",
                ].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Etap rozwoju">
              <select
                value={draft.stage}
                onChange={(e) => set("stage", e.target.value)}
              >
                {["Start", "Rozwój", "Dojrzałość"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Rozpoznawalność marki">
              <select
                value={draft.brand}
                onChange={(e) => set("brand", e.target.value)}
              >
                {["Niska", "Średnia", "Wysoka"].map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </Field>
            <Field label="Wartość transakcji">
              <input
                type="number"
                min="0"
                required
                value={draft.aov}
                onChange={(e) => set("aov", +e.target.value)}
              />
            </Field>
            <Field label="Marża (%)">
              <input
                type="number"
                min="0"
                max="100"
                required
                value={draft.margin}
                onChange={(e) => set("margin", +e.target.value)}
              />
            </Field>
            <Field label="Cykl sprzedaży (dni)">
              <input
                type="number"
                min="0"
                value={draft.cycle}
                onChange={(e) => set("cycle", +e.target.value)}
              />
            </Field>
            <Field label="Obsługa dodatkowych zamówień">
              <input
                type="number"
                min="0"
                value={draft.capacity}
                onChange={(e) => set("capacity", +e.target.value)}
              />
            </Field>
          </div>
          <Field label="Produkty i przewagi konkurencyjne">
            <textarea
              value={draft.products}
              onChange={(e) => set("products", e.target.value)}
              placeholder="Opisz swoją ofertę"
            />
          </Field>
          <Field label="Przewaga konkurencyjna">
            <input
              value={draft.advantage}
              onChange={(e) => set("advantage", e.target.value)}
            />
          </Field>
          <Field label="Sezonowość">
            <input
              value={draft.seasonality}
              onChange={(e) => set("seasonality", e.target.value)}
            />
          </Field>
          <Field label="Zasoby zespołu i aktualne kanały">
            <textarea
              value={draft.resources}
              onChange={(e) => set("resources", e.target.value)}
            />
          </Field>
        </section>
        <section className="card form-card">
          <div className="section-icon">
            <Globe2 size={21} />
          </div>
          <h2>Twoje rynki</h2>
          <p className="muted">
            Każdy rynek ma własne koszty i założenia startowe.
          </p>
          {draft.markets.map((m, index) => (
            <div className="market-form" key={m.id}>
              <div className="market-form-heading">
                <span className="market-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{m.name || "Nowy rynek"}</strong>
                <button
                  type="button"
                  className="icon-button"
                  aria-label={`Usuń rynek ${m.name}`}
                  onClick={() => {
                    if (draft.markets.length < 2)
                      return notify("Plan musi mieć co najmniej jeden rynek.");
                    if (draft.items.some((i) => i.market === m.id))
                      return notify(
                        "Najpierw przenieś lub usuń pozycje tego rynku w edytorze budżetu.",
                      );
                    set(
                      "markets",
                      draft.markets.filter((x) => x.id !== m.id),
                    );
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="form-grid">
                {[
                  ["name", "Nazwa rynku", "text"],
                  ["language", "Język", "text"],
                  ["cpc", "Koszt kliknięcia", "number"],
                  ["conversion", "Konwersja (%)", "number"],
                  ["segment", "Segment klientów", "text"],
                  ["goal", "Cel rynku", "text"],
                ].map(([key, label, type]) => (
                  <Field key={key} label={label}>
                    <input
                      type={type}
                      required={key === "name"}
                      min={key === "cpc" ? 0.01 : 0}
                      max={key === "conversion" ? 100 : undefined}
                      step={type === "number" ? ".01" : undefined}
                      value={m[key]}
                      onChange={(e) =>
                        set(
                          "markets",
                          draft.markets.map((x) =>
                            x.id === m.id
                              ? {
                                  ...x,
                                  [key]:
                                    type === "number"
                                      ? +e.target.value
                                      : e.target.value,
                                }
                              : x,
                          ),
                        )
                      }
                    />
                  </Field>
                ))}
                <Field label="Dojrzałość rynku">
                  <select
                    value={m.maturity}
                    onChange={(e) =>
                      set(
                        "markets",
                        draft.markets.map((x) =>
                          x.id === m.id
                            ? { ...x, maturity: e.target.value }
                            : x,
                        ),
                      )
                    }
                  >
                    <option>Nowy</option>
                    <option>Dojrzały</option>
                  </select>
                </Field>
              </div>
            </div>
          ))}
          <button
            type="button"
            className="button full-width"
            onClick={() =>
              set("markets", [
                ...draft.markets,
                {
                  id: crypto.randomUUID(),
                  name: "",
                  language: "",
                  cpc: 3,
                  conversion: 2,
                  segment: "",
                  goal: "Zwiększenie sprzedaży",
                  maturity: "Nowy",
                },
              ])
            }
          >
            <Plus size={16} />
            Dodaj rynek
          </button>
          <div className="inline-note">
            <Info size={18} />
            <p>
              Koszt i konwersja rynku są punktem startowym dla nowych pozycji.
              Parametry istniejących kanałów edytujesz w budżecie.
            </p>
          </div>
        </section>
      </div>
      <div className="form-bottom">
        <span className="muted">
          Brak danych historycznych: prognozy bazują na ręcznych założeniach.
        </span>
        <button className="button primary" type="submit">
          <Check size={16} />
          Zapisz profil firmy
        </button>
      </div>
    </form>
  );
}
function Recommendations({ plan, setView }) {
  const b2b = plan.model === "B2B";
  const recommendations = [
    {
      icon: Search,
      title: b2b ? "Search i kampanie leadowe" : "Search i kampanie produktowe",
      category: "Reklama płatna",
      share: "30–40%",
      reason: `Docieraj do osób, które aktywnie szukają ${b2b ? "rozwiązania dla swojej firmy" : "produktów z Twojej kategorii"}. Kanał wspiera cel: ${plan.goal.toLowerCase()}.`,
      resources: b2b
        ? "Landing page, materiały eksperckie, pomiar leadów"
        : "Feed produktowy, kreacje, pomiar zakupów",
      time: "2–4 tygodnie",
      assumption: "CPC i konwersja z parametrów pozycji w budżecie.",
      risk: "Mało opłacalny przy niskiej marży lub wysokiej konkurencji.",
    },
    {
      icon: Mail,
      title: "E-mail i automatyzacja CRM",
      category: "CRM i retencja",
      share: "10–15%",
      reason:
        "Wykorzystaj bazę kontaktów do budowania relacji i powtarzalnych zakupów. Segmentacja pomaga dopasować komunikację do odbiorców.",
      resources: "Baza kontaktów ze zgodami, CRM, szablony e-mail",
      time: "1–3 miesiące",
      assumption: "Założenia własne. Koszt platformy CRM ujęty w kanale.",
      risk: "Bez aktywnej bazy kontaktów najpierw zainwestuj w jej rozwój.",
    },
    {
      icon: FileText,
      title: b2b ? "Treści eksperckie i SEO" : "SEO i treści produktowe",
      category: "SEO i treści",
      share: "15–20%",
      reason: `Buduj widoczność w wyszukiwarce i ułatwiaj ${b2b ? "decydentom" : "klientom"} wybór. Działania pasują do etapu „${plan.stage}”.`,
      resources: "Autor treści, audyt SEO, dostęp do strony",
      time: "3–6 miesięcy",
      assumption:
        "Model kosztu pozyskania ruchu; wynik długoterminowy nie jest gwarantowany.",
      risk: "Krótki horyzont planu może nie uwzględniać pełnych efektów.",
    },
    {
      icon: BarChart3,
      title: "Analityka i pomiar efektów",
      category: "Badania i analityka",
      share: "3–5%",
      reason:
        "Spójny pomiar pomaga ograniczyć podwójne przypisywanie przychodu i weryfikować założenia na każdym rynku.",
      resources: "Narzędzie analityczne, dashboard, konfiguracja zdarzeń",
      time: "2–4 tygodnie",
      assumption: "Koszt narzędzia i wdrożenia. ROI nieoszacowany.",
      risk: "Wpływ pośredni — nie przypisujemy temu kanałowi sprzedaży.",
    },
  ];
  return (
    <>
      <div className="recommendation-banner">
        <Sparkles size={23} />
        <div>
          <strong>Rekomendacje dopasowane do Twojego planu</strong>
          <p>
            {plan.model} · {plan.goal} ·{" "}
            {plan.markets.map((m) => m.name).join(", ")}
          </p>
        </div>
        <span className="soft-tag">Model regułowy</span>
      </div>
      <div className="recommendations-grid">
        {recommendations.map((r, n) => (
          <section className="card recommendation" key={r.title}>
            <div className="recommendation-top">
              <span className="section-icon">
                <r.icon size={23} />
              </span>
              <span className="tag">{r.share} budżetu</span>
            </div>
            <span className="eyebrow">{r.category}</span>
            <h2>{r.title}</h2>
            <p>{r.reason}</p>
            <dl>
              <dt>Oczekiwany rezultat</dt>
              <dd>
                {n === 0
                  ? "Ruch o wysokiej intencji i nowe transakcje"
                  : n === 1
                    ? "Powtarzalne zakupy i reaktywacja klientów"
                    : n === 2
                      ? "Wzrost ruchu organicznego"
                      : "Wiarygodniejszy pomiar kampanii"}
              </dd>
              <dt>Czas do pierwszych efektów</dt>
              <dd>{r.time}</dd>
              <dt>Potrzebne zasoby</dt>
              <dd>{r.resources}</dd>
              <dt>Założenia i źródło danych</dt>
              <dd>{r.assumption}</dd>
            </dl>
            <div className="inline-note">
              <Info size={16} />
              <span>{r.risk}</span>
            </div>
            <div className="recommendation-footer">
              <span>
                <ShieldCheck size={14} />
                Pewność: {n === 3 ? "umiarkowana" : "niska"}
              </span>
              <button className="link-button" onClick={() => setView("budget")}>
                Dopasuj budżet
                <ArrowRight size={15} />
              </button>
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
function ScenarioCard({ name, plan, base, onDelete, onApply, onExport }) {
  const r = forecast(plan);
  return (
    <section className={`card scenario-card ${base ? "base" : ""}`}>
      <div className="scenario-card-heading">
        <span className="tag">
          {base ? "BAZOWY" : `WERSJA ${plan.version}`}
        </span>
        {onDelete && (
          <button
            className="icon-button"
            aria-label={`Usuń ${name}`}
            onClick={onDelete}
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <h2>{name}</h2>
      <span className="muted">
        {plan.period} · {plan.model}
      </span>
      <dl>
        {[
          ["Budżet", money(plan.budget, plan.currency)],
          ["Przychód", money(r.revenue, plan.currency)],
          ["Wynik finansowy", money(r.profit, plan.currency)],
          ["ROI", percent(r.roi)],
          ["Marża", percent(plan.margin)],
          ["Wartość transakcji", money(plan.aov, plan.currency)],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <details className="scenario-breakdown">
        <summary>Podział budżetu i założenia</summary>
        <p>
          Przyrostowość: {percent(plan.incrementality)} · nakładanie odbiorców:{" "}
          {percent(plan.overlap)}
        </p>
        {plan.items.map((i) => (
          <div key={i.id}>
            <span>{i.name}</span>
            <strong>{percent(r.cost ? (i.amount / r.cost) * 100 : 0)}</strong>
          </div>
        ))}
      </details>
      <div className="mini-allocation">
        {plan.items.map((i, n) => (
          <span
            key={i.id}
            style={{
              width: `${r.cost ? (i.amount / r.cost) * 100 : 0}%`,
              background: colors[n % colors.length],
            }}
            title={`${i.name}: ${percent(r.cost ? (i.amount / r.cost) * 100 : 0)}`}
          />
        ))}
      </div>
      {onApply && (
        <div className="scenario-buttons">
          <button className="button" onClick={onApply}>
            Zastosuj
          </button>
          <button
            className="icon-button"
            aria-label={`Eksportuj ${name}`}
            onClick={onExport}
          >
            <Download size={17} />
          </button>
        </div>
      )}
    </section>
  );
}
function AccountPanel({ session, onAuth, onLogout }) {
  const [mode, setMode] = useState("login"),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [members, setMembers] = useState([]),
    [role, setRole] = useState("editor"),
    [invitation, setInvitation] = useState("");
  useEffect(() => {
    if (session)
      api("/team")
        .then((d) => setMembers(d.members))
        .catch((e) => setError(e.message));
  }, [session]);
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    const values = Object.fromEntries(new FormData(e.currentTarget));
    try {
      await onAuth(mode, values);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (!serverEnabled)
    return (
      <div className="account-panel">
        <div className="local-status">
          <ShieldCheck size={35} />
          <h3>Twoje plany, w tej przeglądarce</h3>
          <p>
            Wersja GitHub Pages umożliwia planowanie budżetu, porównywanie
            scenariuszy i eksport raportów. Wszystkie zmiany są zapisywane
            lokalnie na tym urządzeniu.
          </p>
        </div>
        <div className="inline-note">
          <Info size={18} />
          <span>
            Logowanie i współpraca zespołowa są dostępne w wersji z serwerem.
            Eksportuj CSV, aby zachować kopię. Wyczyszczenie danych przeglądarki
            usuwa lokalne plany.
          </span>
        </div>
      </div>
    );
  return session ? (
    <div className="account-panel">
      <div className="account-summary">
        <span className="section-icon">
          <ShieldCheck size={23} />
        </span>
        <h3>{session.company}</h3>
        <p>
          {session.name} · {session.email}
        </p>
        <span className="tag">
          {
            {
              owner: "Właściciel",
              editor: "Edytor",
              reader: "Dostęp do odczytu",
            }[session.role]
          }
        </span>
      </div>
      <h3 className="team-heading">Zespół firmy</h3>
      {members.map((m) => (
        <div className="team-member" key={m.id}>
          <span className="avatar">
            {m.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("")}
          </span>
          <div>
            <strong>{m.name}</strong>
            <small>{m.email}</small>
          </div>
          <span className="tag">
            {
              { owner: "Właściciel", editor: "Edytor", reader: "Odczyt" }[
                m.role
              ]
            }
          </span>
        </div>
      ))}
      {session.role === "owner" && (
        <>
          <Field label="Rola nowego członka">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="editor">Edytor</option>
              <option value="reader">Tylko odczyt</option>
            </select>
          </Field>
          <button
            className="button full-width"
            onClick={async () => {
              try {
                const r = await api("/team/invite", {
                  method: "POST",
                  body: { role },
                });
                setInvitation(r.invitation);
                setError("");
              } catch (e) {
                setError(e.message);
              }
            }}
          >
            <Plus size={16} />
            Utwórz kod zaproszenia
          </button>
          {invitation && (
            <div className="invitation">
              <label>
                Kod jednorazowy, ważny 7 dni
                <input
                  readOnly
                  value={invitation}
                  onFocus={(e) => e.target.select()}
                />
              </label>
              <p>
                Przekaż kod członkowi zespołu. Wpisze go przy tworzeniu konta.
              </p>
            </div>
          )}
        </>
      )}
      <div className="inline-note">
        <Info size={17} />
        <span>
          Dane tej firmy są przechowywane na serwerze. Uprawnienia są sprawdzane
          przy każdym odczycie i zapisie.
        </span>
      </div>
      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}
      <button
        className="button full-width"
        onClick={async () => {
          try {
            await onLogout();
          } catch (e) {
            setError(e.message);
          }
        }}
      >
        Wyloguj się
      </button>
    </div>
  ) : (
    <div className="account-panel">
      <div className="auth-tabs">
        <button
          className={mode === "login" ? "active" : ""}
          onClick={() => {
            setMode("login");
            setError("");
          }}
        >
          Zaloguj się
        </button>
        <button
          className={mode === "register" ? "active" : ""}
          onClick={() => {
            setMode("register");
            setError("");
          }}
        >
          Utwórz konto
        </button>
      </div>
      <p className="muted auth-intro">
        Zachowaj plany w przestrzeni firmy i zaproś swój zespół. Plan
        demonstracyjny pozostaje zapisany lokalnie.
      </p>
      <form onSubmit={submit}>
        {mode === "register" && (
          <div className="form-grid">
            <Field label="Imię i nazwisko">
              <input name="name" autoComplete="name" required maxLength="100" />
            </Field>
            <Field label="Nazwa firmy">
              <input
                name="company"
                autoComplete="organization"
                maxLength="100"
                placeholder="lub użyj kodu zaproszenia"
              />
            </Field>
          </div>
        )}
        <Field label="E-mail">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength="254"
          />
        </Field>
        <Field label="Hasło">
          <input
            name="password"
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            required
            minLength={mode === "register" ? 10 : undefined}
            maxLength="200"
            placeholder={mode === "register" ? "Co najmniej 10 znaków" : ""}
          />
        </Field>
        {mode === "register" && (
          <Field
            label="Kod zaproszenia (opcjonalny)"
            hint="Z kodem dołączysz do firmy zapraszającej osoby."
          >
            <input name="invitation" autoComplete="off" />
          </Field>
        )}
        {error && (
          <p className="auth-error" role="alert">
            {error}
          </p>
        )}
        <button
          className="button primary full-width"
          type="submit"
          disabled={busy}
        >
          {busy
            ? "Łączenie…"
            : mode === "login"
              ? "Otwórz przestrzeń firmy"
              : "Utwórz przestrzeń firmy"}
          <ArrowRight size={16} />
        </button>
      </form>
      <div className="inline-note">
        <LockKeyhole size={16} />
        <span>
          Każda firma ma osobną przestrzeń. Hasła są przechowywane w postaci
          skrótów scrypt. Sesja używa ciasteczka HttpOnly.
        </span>
      </div>
    </div>
  );
}

function Modal({
  modal,
  plan,
  onClose,
  onSave,
  onDelete,
  session,
  onAuth,
  onLogout,
}) {
  const type = modal.type;
  const info = ["help", "settings", "account"].includes(type);
  const [draft, setDraft] = useState(() =>
    type === "item"
      ? modal.item
        ? { ...modal.item }
        : {
            name: "",
            detail: "",
            category: "Reklama płatna",
            market: plan.markets[0].id,
            amount: 0,
            cpc: plan.markets[0].cpc,
            conversion: plan.markets[0].conversion,
            forecast: true,
            min: 0,
            max: plan.budget,
            scale: 50000,
            type: "Zależny od skali",
          }
      : type === "newplan"
        ? {
            name: "",
            company: plan.company,
            budget: 100000,
            period: "Kwartał",
            currency: "PLN",
          }
        : type === "scenario"
          ? { name: `Scenariusz · ${new Date().toLocaleDateString("pl-PL")}` }
          : { ...plan },
  );
  const set = (key, value) => setDraft((d) => ({ ...d, [key]: value }));
  const titles = {
    item: modal.item ? "Edytuj pozycję" : "Nowa pozycja kosztowa",
    plan: "Ustawienia planu",
    newplan: "Nowy plan marketingowy",
    assumptions: "Założenia prognozy",
    scenario: "Zapisz scenariusz",
    help: "Zaplanuj. Porównaj. Zdecyduj.",
    settings: "Ustawienia przestrzeni",
    account: "Twoja przestrzeń robocza",
  };
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const nodes = [
            ...e.currentTarget.querySelectorAll(
              "button:not([disabled]), input, select, textarea, a[href]",
            ),
          ];
          if (e.shiftKey && document.activeElement === nodes[0]) {
            e.preventDefault();
            nodes.at(-1)?.focus();
          } else if (!e.shiftKey && document.activeElement === nodes.at(-1)) {
            e.preventDefault();
            nodes[0]?.focus();
          }
        }}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">PLANLY / TWÓJ PLAN</span>
            <h2 id="modal-title">{titles[type]}</h2>
          </div>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Zamknij okno"
          >
            <X size={21} />
          </button>
        </div>
        {info ? (
          <div className="dialog-content">
            {type === "account" || type === "settings" ? (
              <AccountPanel
                session={session}
                onAuth={onAuth}
                onLogout={onLogout}
              />
            ) : type === "help" ? (
              <>
                <p>Przejdź od celów do konkretnego planu inwestycji.</p>
                {[
                  [
                    "01",
                    "Uzupełnij profil",
                    "Określ model biznesowy, marżę, cele i rynki.",
                  ],
                  [
                    "02",
                    "Rozdziel budżet",
                    "Edytuj pozycje, zablokuj stałe koszty i wyznacz limity.",
                  ],
                  [
                    "03",
                    "Sprawdź założenia",
                    "Dopasuj koszt kliknięcia i konwersję dla każdego kanału.",
                  ],
                  [
                    "04",
                    "Porównaj i eksportuj",
                    "Zapisz scenariusze. Pobierz CSV lub wydrukuj raport do PDF.",
                  ],
                ].map(([n, h, p]) => (
                  <div className="help-step" key={n}>
                    <span>{n}</span>
                    <div>
                      <h3>{h}</h3>
                      <p>{p}</p>
                    </div>
                  </div>
                ))}
                <div className="inline-note">
                  <Info size={18} />
                  <span>
                    ROI uwzględnia marżę i wszystkie koszty marketingu. ROAS
                    porównuje przychód tylko z wydatkami reklamowymi.
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="local-status">
                  <ShieldCheck size={35} />
                  <h3>Tryb lokalny</h3>
                  <p>
                    Plany i scenariusze są zapisywane w tej przeglądarce.
                    Zaloguj się, aby korzystać z przestrzeni firmy i współpracy
                    zespołowej.
                  </p>
                </div>
                <div className="inline-note">
                  <Info size={18} />
                  <span>
                    Eksportuj CSV, aby zachować kopię. Usunięcie danych
                    przeglądarki usuwa również zapisane plany.
                  </span>
                </div>
              </>
            )}
            <button className="button primary full-width" onClick={onClose}>
              Rozumiem
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                type === "item" &&
                (draft.min > draft.max ||
                  draft.amount < draft.min ||
                  draft.amount > draft.max)
              ) {
                e.currentTarget
                  .querySelector('[name="amount"]')
                  .setCustomValidity(
                    "Kwota musi mieścić się między minimum a maksimum.",
                  );
                e.currentTarget.reportValidity();
                return;
              }
              if (type === "assumptions") {
                const {
                  aov,
                  margin,
                  conversion,
                  qualified,
                  closeRate,
                  churn,
                  months,
                  incrementality,
                  overlap,
                } = draft;
                onSave({
                  aov,
                  margin,
                  conversion,
                  qualified,
                  closeRate,
                  churn,
                  months,
                  incrementality,
                  overlap,
                  items: plan.items.map((i) =>
                    i.forecast && conversion !== plan.conversion
                      ? { ...i, conversion: conversion }
                      : i,
                  ),
                });
                return;
              }
              onSave(draft);
            }}
          >
            <div className="dialog-content">
              {(type === "plan" || type === "newplan") && (
                <>
                  <Field label="Nazwa planu">
                    <input
                      required
                      autoFocus
                      value={draft.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="np. Strategia wzrostu 2026"
                    />
                  </Field>
                  {type === "newplan" && (
                    <Field label="Nazwa firmy">
                      <input
                        required
                        value={draft.company}
                        onChange={(e) => set("company", e.target.value)}
                      />
                    </Field>
                  )}
                  <Field label="Całkowity budżet">
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={draft.budget}
                      onChange={(e) => set("budget", +e.target.value)}
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Okres planowania">
                      <select
                        value={draft.period}
                        onChange={(e) => set("period", e.target.value)}
                      >
                        <option>Miesiąc</option>
                        <option>Kwartał</option>
                        <option>Rok</option>
                      </select>
                    </Field>
                    <Field label="Waluta">
                      <select
                        value={draft.currency}
                        onChange={(e) => set("currency", e.target.value)}
                      >
                        <option>PLN</option>
                        <option>EUR</option>
                        <option>USD</option>
                        <option>GBP</option>
                      </select>
                    </Field>
                  </div>
                  <div className="inline-note">
                    <Info size={16} />
                    <span>
                      {type === "newplan"
                        ? "Zaczniesz z przykładowym podziałem na dwa rynki. Dopasuj profil i założenia do swojej firmy."
                        : "Zmiana budżetu nie zmienia kwot pozycji. Użyj automatycznego podziału w edytorze. Zmiana waluty zmienia jednostkę, bez przeliczania kursowego."}
                    </span>
                  </div>
                </>
              )}
              {type === "scenario" && (
                <>
                  <Field label="Nazwa scenariusza">
                    <input
                      required
                      value={draft.name}
                      onChange={(e) => set("name", e.target.value)}
                    />
                  </Field>
                  <p className="muted">
                    Zachowamy cały podział budżetu i założenia bieżącej wersji
                    planu.
                  </p>
                </>
              )}
              {type === "assumptions" && (
                <>
                  <div className="inline-note">
                    <Info size={17} />
                    <span>
                      Źródło: ręczne założenia startowe. Zakres ±25% to
                      orientacyjna analiza wrażliwości, nie statystyczny
                      przedział ufności.
                    </span>
                  </div>
                  <div className="form-grid">
                    {[
                      ["aov", "Średnia wartość transakcji", 0, null],
                      ["margin", "Marża (%)", 0, 100],
                      [
                        "conversion",
                        "Konwersja wszystkich kanałów (%)",
                        0,
                        100,
                      ],
                      ["incrementality", "Przyrostowość (%)", 0, 100],
                      ["overlap", "Nakładanie odbiorców (%)", 0, 100],
                      ...(plan.model === "B2B"
                        ? [["qualified", "Leady kwalifikowane (%)", 0, 100]]
                        : []),
                      ...(["B2B", "Usługi"].includes(plan.model)
                        ? [["closeRate", "Skuteczność sprzedaży (%)", 0, 100]]
                        : []),
                      ...(plan.model === "Subskrypcja"
                        ? [
                            ["months", "Horyzont (miesiące)", 1, 120],
                            ["churn", "Rezygnacje miesięczne (%)", 0, 100],
                          ]
                        : []),
                    ].map(([key, label, min, max]) => (
                      <Field key={key} label={label}>
                        <input
                          required
                          type="number"
                          min={min}
                          max={max ?? undefined}
                          step={key === "months" ? "1" : ".01"}
                          value={draft[key]}
                          onChange={(e) => set(key, +e.target.value)}
                        />
                      </Field>
                    ))}
                  </div>
                  <p className="muted">
                    Zmiana globalnej konwersji zastąpi konwersje wszystkich
                    kanałów. Pozostałe zmiany zachowują parametry kanałów.
                    Indywidualne parametry i limity skali edytujesz w pozycjach
                    budżetu.
                  </p>
                  <div className="formula">
                    ROI = (przychód × marża − koszty) / koszty × 100%
                  </div>
                </>
              )}
              {type === "item" && (
                <>
                  <Field label="Nazwa kanału / pozycji">
                    <input
                      required
                      value={draft.name}
                      onChange={(e) => set("name", e.target.value)}
                      placeholder="np. Kampania LinkedIn"
                    />
                  </Field>
                  <Field label="Opis">
                    <input
                      value={draft.detail}
                      onChange={(e) => set("detail", e.target.value)}
                    />
                  </Field>
                  <div className="form-grid">
                    <Field label="Kategoria">
                      <input
                        list="categories"
                        required
                        value={draft.category}
                        onChange={(e) => set("category", e.target.value)}
                      />
                      <datalist id="categories">
                        {[
                          "Reklama płatna",
                          "SEO i treści",
                          "CRM i retencja",
                          "PR i marka",
                          "Wydarzenia",
                          "Badania i analityka",
                          "Obsługa i produkcja",
                          "Rezerwa",
                        ].map((x) => (
                          <option key={x} value={x} />
                        ))}
                      </datalist>
                    </Field>
                    <Field label="Rynek">
                      <select
                        value={draft.market}
                        onChange={(e) => {
                          const m = plan.markets.find(
                            (m) => m.id === e.target.value,
                          );
                          setDraft((d) => ({
                            ...d,
                            market: m.id,
                            ...(!modal.item
                              ? { cpc: m.cpc, conversion: m.conversion }
                              : {}),
                          }));
                        }}
                      >
                        {plan.markets.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label={`Kwota (${plan.currency})`}>
                      <input
                        name="amount"
                        required
                        type="number"
                        min="0"
                        step=".01"
                        value={draft.amount}
                        onChange={(e) => {
                          e.target.setCustomValidity("");
                          set("amount", +e.target.value);
                        }}
                      />
                    </Field>
                    <Field label="Rodzaj kosztu">
                      <select
                        value={draft.type}
                        onChange={(e) => set("type", e.target.value)}
                      >
                        <option>Jednorazowy</option>
                        <option>Cykliczny</option>
                        <option>Zależny od skali</option>
                      </select>
                    </Field>
                    <Field label="Minimum">
                      <input
                        required
                        type="number"
                        min="0"
                        value={draft.min}
                        onChange={(e) => {
                          document
                            .querySelector('[name="amount"]')
                            .setCustomValidity("");
                          set("min", +e.target.value);
                        }}
                      />
                    </Field>
                    <Field label="Maksimum">
                      <input
                        required
                        type="number"
                        min="0"
                        value={draft.max}
                        onChange={(e) => {
                          document
                            .querySelector('[name="amount"]')
                            .setCustomValidity("");
                          set("max", +e.target.value);
                        }}
                      />
                    </Field>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={draft.forecast}
                      onChange={(e) => set("forecast", e.target.checked)}
                    />
                    Uwzględnij prognozę finansową
                  </label>
                  {draft.forecast && (
                    <div className="form-grid">
                      <Field label="Koszt kliknięcia (CPC)">
                        <input
                          required
                          type="number"
                          min=".01"
                          step=".01"
                          value={draft.cpc ?? 3}
                          onChange={(e) => set("cpc", +e.target.value)}
                        />
                      </Field>
                      <Field label="Konwersja (%)">
                        <input
                          required
                          type="number"
                          min="0"
                          max="100"
                          step=".01"
                          value={draft.conversion ?? plan.conversion}
                          onChange={(e) => set("conversion", +e.target.value)}
                        />
                      </Field>
                      <Field label="Limit efektywnej skali">
                        <input
                          required
                          type="number"
                          min="1"
                          value={draft.scale}
                          onChange={(e) => set("scale", +e.target.value)}
                        />
                      </Field>
                    </div>
                  )}
                  <div className="inline-note">
                    <Info size={16} />
                    <span>
                      {draft.forecast
                        ? "Powyżej limitu skali przyrost efektów maleje. Źródło parametrów: Twoje założenia."
                        : "Koszt pozostaje w całkowitym budżecie. ROI tej pozycji nie będzie szacowany."}
                    </span>
                  </div>
                </>
              )}
            </div>
            <div className="dialog-footer">
              {type === "item" && modal.item ? (
                <button
                  type="button"
                  className="button danger"
                  onClick={onDelete}
                >
                  <Trash2 size={15} />
                  Usuń
                </button>
              ) : (
                <button type="button" className="button" onClick={onClose}>
                  Anuluj
                </button>
              )}
              <button type="submit" className="button primary">
                <Check size={16} />
                {type === "newplan" ? "Utwórz plan" : "Zapisz zmiany"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
function PrintReport({ plan, result }) {
  return (
    <div className="print-report">
      <h1>planly. / {plan.name}</h1>
      <p>
        Wersja {plan.version} · {new Date().toLocaleDateString("pl-PL")} ·{" "}
        {plan.period} · {plan.currency}
      </p>
      <h2>Podsumowanie</h2>
      <p>
        Budżet: {money(plan.budget, plan.currency)}. Koszty:{" "}
        {money(result.cost, plan.currency)}. Przychód:{" "}
        {money(result.revenue, plan.currency)}. Wynik:{" "}
        {money(result.profit, plan.currency)}. ROI: {percent(result.roi)}.
      </p>
      <p>
        Próg rentowności:{" "}
        {result.breakeven === null
          ? "Nieoszacowany"
          : money(result.breakeven, plan.currency)}
        . Pokrycie prognozą: {percent(result.coverage)}. Zakres przychodu:{" "}
        {money(result.revenue * 0.75, plan.currency)}–
        {money(result.revenue * 1.25, plan.currency)}.
      </p>
      <h2>Podział budżetu</h2>
      <Donut items={plan.items} currency={plan.currency} />
      <BudgetTable
        items={plan.items}
        plan={plan}
        forecastMode
        onEdit={() => {}}
      />
      <h2>Założenia i źródła</h2>
      <p>
        Model: {plan.model}; horyzont:{" "}
        {plan.model === "Subskrypcja"
          ? `${plan.months} miesięcy`
          : plan.horizon}
        ; marża: {plan.margin}%; wartość transakcji:{" "}
        {money(plan.aov, plan.currency)}; przyrostowość: {plan.incrementality}%;
        nakładanie odbiorców: {plan.overlap}%; leady kwalifikowane:{" "}
        {plan.qualified}%; skuteczność sprzedaży: {plan.closeRate}%; rezygnacje:{" "}
        {plan.churn}% miesięcznie.
      </p>
      {plan.items
        .filter((i) => i.forecast)
        .map((i) => (
          <p key={i.id}>
            {i.name}: CPC {i.cpc}, konwersja {i.conversion}%, limit skali{" "}
            {money(i.scale, plan.currency)}.
          </p>
        ))}
      <p>
        Źródło: ręczne założenia. Pewność umiarkowana. Zakres ±25% jest analizą
        wrażliwości, nie przedziałem ufności. ROI = (przychód × marża −
        wszystkie koszty marketingu) / koszty. ROAS reklam:{" "}
        {result.roas.toFixed(2)}×.
      </p>
      <h2>Rekomendacje</h2>
      <p>
        Search: docieranie do klientów z intencją zakupową; wymagane materiały i
        pomiar. CRM: segmentacja istniejącej bazy; nieopłacalny bez bazy
        kontaktów. SEO: inwestycja w ruch organiczny, efekty w 3–6 miesięcy.
        Analityka: pomiar i ograniczanie podwójnego przypisywania efektów; ROI
        nieoszacowany.
      </p>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
