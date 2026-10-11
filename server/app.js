import express from "express";
import {
  randomBytes,
  scryptSync,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { initialPlan } from "../src/model.js";
export function createApp({
  dataDir = path.resolve(".data"),
  production = false,
} = {}) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const filename = path.join(dataDir, "store.json");
  let db = existsSync(filename)
    ? JSON.parse(readFileSync(filename, "utf8"))
    : { users: [], companies: [], sessions: [], invitations: [] };
  const persist = () => {
    writeFileSync(filename + ".tmp", JSON.stringify(db), { mode: 0o600 });
    renameSync(filename + ".tmp", filename);
  };
  const hash = (x) => createHash("sha256").update(x).digest("hex");
  const passwordHash = (password, salt) =>
    scryptSync(password, salt, 64).toString("hex");
  const app = express();
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "same-origin");
    res.setHeader("X-Frame-Options", "DENY");
    if (req.path.startsWith("/api/"))
      res.setHeader("Cache-Control", "no-store");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      if (req.headers["sec-fetch-site"] === "cross-site")
        return res
          .status(403)
          .json({ error: "Żądanie z innej witryny jest niedozwolone." });
      if (!req.is("application/json"))
        return res.status(415).json({ error: "Wymagany format JSON." });
    }
    next();
  });
  app.use(express.json({ limit: "2mb" }));
  const attempts = new Map();
  const rateLimit = (req, res, next) => {
    const key = req.ip;
    const now = Date.now();
    const a = attempts.get(key) || { count: 0, until: now + 15 * 60e3 };
    if (a.until < now) {
      a.count = 0;
      a.until = now + 15 * 60e3;
    }
    a.count++;
    attempts.set(key, a);
    if (a.count > 30)
      return res
        .status(429)
        .json({ error: "Zbyt wiele prób. Spróbuj ponownie za 15 minut." });
    next();
  };
  const publicUser = (u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    company: db.companies.find((c) => c.id === u.companyId)?.name,
  });
  const startSession = (u, res) => {
    const token = randomBytes(32).toString("hex");
    db.sessions = db.sessions.filter((s) => s.expires > Date.now());
    db.sessions.push({
      token: hash(token),
      userId: u.id,
      expires: Date.now() + 7 * 86400e3,
    });
    persist();
    res.cookie("planly_session", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      maxAge: 7 * 86400e3,
      path: "/",
    });
  };
  const authenticate = (req, res, next) => {
    const cookie = (req.headers.cookie || "")
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("planly_session="));
    const token = cookie?.slice(15);
    const session =
      token &&
      db.sessions.find(
        (s) => s.token === hash(token) && s.expires > Date.now(),
      );
    const u = session && db.users.find((u) => u.id === session.userId);
    if (!u)
      return res
        .status(401)
        .json({ error: "Zaloguj się, aby otworzyć przestrzeń firmy." });
    req.user = u;
    req.session = session;
    next();
  };
  app.post("/api/auth/register", rateLimit, (req, res) => {
    const { name, email, password, company, invitation } = req.body || {};
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 100 ||
      typeof email !== "string" ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      email.length > 254 ||
      typeof password !== "string" ||
      password.length < 10 ||
      password.length > 200
    )
      return res
        .status(400)
        .json({
          error:
            "Podaj nazwę, poprawny e-mail i hasło o długości 10–200 znaków.",
        });
    if (db.users.some((u) => u.email === email.trim().toLowerCase()))
      return res
        .status(409)
        .json({
          error:
            "Nie można utworzyć konta dla tego adresu. Spróbuj się zalogować.",
        });
    let companyId,
      role = "owner";
    if (invitation) {
      const invite =
        typeof invitation === "string" &&
        db.invitations.find(
          (i) =>
            i.token === hash(invitation) && i.expires > Date.now() && !i.used,
        );
      if (!invite)
        return res
          .status(400)
          .json({ error: "Zaproszenie jest nieprawidłowe lub wygasło." });
      companyId = invite.companyId;
      role = invite.role;
      invite.used = true;
    } else {
      if (
        typeof company !== "string" ||
        !company.trim() ||
        company.length > 100
      )
        return res.status(400).json({ error: "Podaj nazwę firmy." });
      companyId = randomBytes(16).toString("hex");
      const plan = structuredClone(initialPlan);
      plan.company = company.trim();
      db.companies.push({
        id: companyId,
        name: company.trim(),
        data: { plans: [plan], active: plan.id, scenarios: [] },
      });
    }
    const salt = randomBytes(16).toString("hex");
    const u = {
      id: randomBytes(16).toString("hex"),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      salt,
      password: passwordHash(password, salt),
      companyId,
      role,
    };
    db.users.push(u);
    startSession(u, res);
    res.status(201).json({ user: publicUser(u) });
  });
  app.post("/api/auth/login", rateLimit, (req, res) => {
    const { email, password } = req.body || {};
    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      password.length > 200
    )
      return res.status(400).json({ error: "Podaj e-mail i hasło." });
    const u = db.users.find((u) => u.email === email.trim().toLowerCase());
    const given = passwordHash(password, u?.salt || "invalid-account-salt");
    if (
      !u ||
      !timingSafeEqual(
        Buffer.from(given, "hex"),
        Buffer.from(u.password, "hex"),
      )
    )
      return res.status(401).json({ error: "Nieprawidłowy e-mail lub hasło." });
    startSession(u, res);
    res.json({ user: publicUser(u) });
  });
  app.get("/api/auth/me", authenticate, (req, res) =>
    res.json({ user: publicUser(req.user) }),
  );
  app.post("/api/auth/logout", authenticate, (req, res) => {
    db.sessions = db.sessions.filter((s) => s !== req.session);
    persist();
    res.clearCookie("planly_session", {
      httpOnly: true,
      sameSite: "lax",
      secure: production,
      path: "/",
    });
    res.json({ ok: true });
  });
  app.get("/api/workspace", authenticate, (req, res) =>
    res.json(db.companies.find((c) => c.id === req.user.companyId).data),
  );
  app.put("/api/workspace", authenticate, (req, res) => {
    if (req.user.role === "reader")
      return res
        .status(403)
        .json({ error: "Twoja rola pozwala tylko na odczyt." });
    if (!validWorkspace(req.body))
      return res
        .status(400)
        .json({
          error:
            "Plan zawiera nieprawidłowe dane lub przekracza limit 200 pozycji.",
        });
    const c = db.companies.find((c) => c.id === req.user.companyId);
    c.data = req.body;
    persist();
    res.json({ ok: true });
  });
  app.get("/api/team", authenticate, (req, res) =>
    res.json({
      members: db.users
        .filter((u) => u.companyId === req.user.companyId)
        .map(publicUser),
    }),
  );
  app.post("/api/team/invite", authenticate, (req, res) => {
    if (req.user.role !== "owner")
      return res
        .status(403)
        .json({ error: "Tylko właściciel może zapraszać członków." });
    const role = req.body?.role;
    if (!["editor", "reader"].includes(role))
      return res
        .status(400)
        .json({
          error: "Wybierz rolę edytora lub osoby z dostępem do odczytu.",
        });
    const token = randomBytes(24).toString("hex");
    db.invitations.push({
      token: hash(token),
      companyId: req.user.companyId,
      role,
      expires: Date.now() + 7 * 86400e3,
      used: false,
    });
    persist();
    res.status(201).json({ invitation: token });
  });
  app.use("/api", (_, res) =>
    res.status(404).json({ error: "Nie znaleziono zasobu." }),
  );
  app.use((err, req, res, next) => {
    if (err.type === "entity.too.large")
      return res
        .status(413)
        .json({ error: "Dane przekraczają dozwolony rozmiar." });
    res
      .status(err.status === 400 ? 400 : 500)
      .json({
        error:
          err.status === 400
            ? "Nieprawidłowy JSON."
            : "Nie udało się wykonać operacji.",
      });
  });
  return app;
}
function validWorkspace(d) {
  const num = (v, min = 0, max = 1e12) =>
    typeof v === "number" && Number.isFinite(v) && v >= min && v <= max;
  const str = (v) => typeof v === "string" && v.length <= 1000;
  const plan = (p) =>
    p &&
    str(p.id) &&
    str(p.name) &&
    str(p.company) &&
    ["E-commerce", "B2B", "B2C", "Usługi", "Subskrypcja"].includes(p.model) &&
    ["PLN", "EUR", "USD", "GBP"].includes(p.currency) &&
    ["Kwartał", "Rok", "Miesiąc"].includes(p.period) &&
    num(p.budget) &&
    num(p.aov) &&
    num(p.margin, 0, 100) &&
    num(p.conversion, 0, 100) &&
    num(p.incrementality, 0, 100) &&
    num(p.overlap, 0, 100) &&
    num(p.qualified, 0, 100) &&
    num(p.closeRate, 0, 100) &&
    num(p.churn, 0, 100) &&
    num(p.months, 1, 120) &&
    num(p.version, 1) &&
    Array.isArray(p.markets) &&
    p.markets.length > 0 &&
    p.markets.length <= 50 &&
    p.markets.every(
      (m) =>
        str(m.id) &&
        str(m.name) &&
        num(m.cpc, 0.01) &&
        num(m.conversion, 0, 100),
    ) &&
    Array.isArray(p.items) &&
    p.items.length <= 200 &&
    p.items.every(
      (i) =>
        str(i.id) &&
        str(i.name) &&
        str(i.category) &&
        p.markets.some((m) => m.id === i.market) &&
        num(i.amount) &&
        num(i.min) &&
        num(i.max) &&
        typeof i.locked === "boolean" &&
        typeof i.forecast === "boolean" &&
        (!i.forecast ||
          (num(i.cpc, 0.01) && num(i.conversion, 0, 100) && num(i.scale, 1))),
    );
  return (
    d &&
    Array.isArray(d.plans) &&
    d.plans.length > 0 &&
    d.plans.length <= 100 &&
    d.plans.every(plan) &&
    d.plans.some((p) => p.id === d.active) &&
    Array.isArray(d.scenarios) &&
    d.scenarios.length <= 200 &&
    d.scenarios.every(
      (s) => str(s.id) && str(s.name) && str(s.source) && plan(s.plan),
    )
  );
}
