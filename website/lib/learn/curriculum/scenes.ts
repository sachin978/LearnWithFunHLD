import type { SceneDefinition, SceneEdge, SceneToken, TokenState } from "@/lib/learn/scene/types";

const at = (id: string, state: TokenState, actor: string, extra: Partial<SceneToken> = {}): SceneToken => ({ id, state, at: actor, ...extra });
const on = (id: string, state: TokenState, edge: string, t = 0.5, extra: Partial<SceneToken> = {}): SceneToken => ({ id, state, edge, t, ...extra });
const edge = (from: string, to: string, label?: string, dashed?: boolean): SceneEdge => ({ id: `${from}-${to}`, from, to, label, dashed });

export const requestFlowScene: SceneDefinition = {
  id: "request-flow",
  title: "What happens when you open a website",
  description: "A browser resolves a domain with DNS, then sends an HTTPS request through a load balancer to an app server, which reads from a database and returns a response.",
  width: 700,
  height: 270,
  actors: [
    { id: "browser", kind: "client", label: "Browser", sub: "shop.example.com", x: 70, y: 150, w: 120 },
    { id: "dns", kind: "service", label: "DNS", sub: "name → IP", x: 70, y: 45, w: 110, h: 50 },
    { id: "lb", kind: "service", label: "Load balancer", x: 255, y: 150, w: 130 },
    { id: "app", kind: "consumer", label: "App server", sub: "GET /products", x: 445, y: 150, w: 130 },
    { id: "db", kind: "store", label: "Database", x: 620, y: 150, w: 120, h: 62 },
  ],
  edges: [edge("browser", "dns", "1. lookup", true), edge("browser", "lb", "2. HTTPS"), edge("lb", "app"), edge("app", "db", "query")],
  steps: [
    { title: "DNS lookup", caption: "The browser asks DNS for the IP address of shop.example.com (often answered from a cache).", tokens: [on("q", "transit", "browser-dns", 0.55, { label: "?" })], edges: { "browser-dns": "active" } },
    { title: "Connect", caption: "With the IP, it opens a TCP connection and a TLS session — HTTPS encrypts everything that follows.", tokens: [at("q", "acked", "dns", { label: "IP" })], actors: { browser: { status: "active", badge: "TCP + TLS", badgeTone: "indigo" } } },
    { title: "Request", caption: "It sends an HTTP request (method, path, headers). The load balancer picks a healthy app server.", tokens: [at("r", "accepted", "lb", { label: "R" })], edges: { "browser-lb": "active" }, actors: { lb: { status: "active" } } },
    { title: "Business logic", caption: "The app server authenticates the request and runs the handler for GET /products.", tokens: [at("r", "processing", "app", { label: "R" })], edges: { "lb-app": "active" }, actors: { app: { status: "busy" } } },
    { title: "Data", caption: "It queries the database. This round-trip is usually the slowest part — the reason caches exist.", tokens: [at("r", "processing", "db", { label: "R" })], edges: { "app-db": "active" }, actors: { db: { status: "busy", badge: "~5–50 ms", badgeTone: "amber" } } },
    { title: "Response", caption: "A JSON response with a status code (200 OK) travels back the same path and the page renders.", tokens: [at("r", "acked", "browser", { label: "200" })], edges: { "browser-lb": "active", "lb-app": "active" }, actors: { browser: { status: "ok", badge: "200 OK", badgeTone: "emerald" } }, durationMs: 2600 },
  ],
};

export const cacheAsideScene: SceneDefinition = {
  id: "cache-aside",
  title: "Cache-aside: miss, fill, hit, invalidate",
  description: "An app server checks a cache first, falls back to the database on a miss, fills the cache, serves later reads from the cache, and invalidates on write.",
  width: 640,
  height: 260,
  actors: [
    { id: "app", kind: "consumer", label: "App server", x: 100, y: 130, w: 130 },
    { id: "cache", kind: "store", label: "Redis cache", sub: "TTL 5 min", x: 380, y: 55, w: 160, h: 62 },
    { id: "db", kind: "store", label: "Database", sub: "source of truth", x: 380, y: 205, w: 160, h: 62 },
  ],
  edges: [edge("app", "cache", "1. get"), edge("app", "db", "2. on miss")],
  steps: [
    { title: "Read #1", caption: "A request needs product 42. The app checks the cache first.", tokens: [on("k", "transit", "app-cache", 0.6, { label: "42" })], edges: { "app-cache": "active" } },
    { title: "Miss", caption: "Cache miss — the key isn't there yet.", tokens: [at("k", "rejected", "cache", { label: "42" })], actors: { cache: { status: "failed", badge: "miss", badgeTone: "rose" } } },
    { title: "Database", caption: "The app reads from the database (slower, ~10 ms+)…", tokens: [at("k", "processing", "db", { label: "42" })], edges: { "app-db": "active" }, actors: { db: { status: "busy" } } },
    { title: "Fill", caption: "…then writes the value into the cache with a TTL so it expires eventually.", tokens: [at("v", "stored", "cache", { label: "42" })], edges: { "app-cache": "active" }, actors: { cache: { status: "ok", badge: "set 42, TTL 300s", badgeTone: "indigo" } } },
    { title: "Read #2: hit", caption: "The next request for product 42 is served straight from memory (~1 ms). The database isn't touched.", tokens: [at("v", "stored", "cache", { label: "42" }), at("h", "acked", "app", { label: "42" })], edges: { "app-cache": "active", "app-db": "muted" }, actors: { cache: { status: "ok", badge: "hit", badgeTone: "emerald" } } },
    { title: "Write → invalidate", caption: "When the price changes, the app updates the database and deletes the cache key. Otherwise readers see stale data until the TTL expires.", tokens: [at("w", "processing", "db", { label: "42" })], edges: { "app-db": "active", "app-cache": "failed" }, actors: { cache: { status: "muted", badge: "del 42", badgeTone: "rose" }, db: { status: "ok", badge: "price updated", badgeTone: "emerald" } }, durationMs: 3000 },
  ],
};

export const loadBalancerScene: SceneDefinition = {
  id: "load-balancer",
  title: "Load balancing with health checks",
  description: "A load balancer spreads requests across three stateless app servers, detects a failed server through health checks and stops sending it traffic.",
  width: 640,
  height: 290,
  actors: [
    { id: "clients", kind: "client", label: "Clients", x: 70, y: 145, w: 110 },
    { id: "lb", kind: "service", label: "Load balancer", sub: "round robin", x: 250, y: 145, w: 140 },
    { id: "s1", kind: "consumer", label: "App 1", x: 500, y: 50, w: 120, h: 50 },
    { id: "s2", kind: "consumer", label: "App 2", x: 500, y: 145, w: 120, h: 50 },
    { id: "s3", kind: "consumer", label: "App 3", x: 500, y: 240, w: 120, h: 50 },
  ],
  edges: [edge("clients", "lb"), edge("lb", "s1"), edge("lb", "s2"), edge("lb", "s3")],
  steps: [
    { title: "Request 1", caption: "Requests arrive at one address. Round robin sends the first to App 1.", tokens: [at("a", "processing", "s1", { label: "1" })], edges: { "clients-lb": "active", "lb-s1": "active" } },
    { title: "Request 2", caption: "The next goes to App 2. The servers are stateless, so any of them can handle any request.", tokens: [at("a", "acked", "s1", { label: "1" }), at("b", "processing", "s2", { label: "2" })], edges: { "lb-s2": "active" } },
    { title: "Request 3", caption: "…and App 3. Load is spread evenly; adding a fourth server adds capacity (horizontal scaling).", tokens: [at("b", "acked", "s2", { label: "2" }), at("c", "processing", "s3", { label: "3" })], edges: { "lb-s3": "active" } },
    { title: "Server fails", caption: "App 2 crashes. The load balancer's periodic health check (e.g. GET /health) starts failing.", tokens: [at("c", "acked", "s3", { label: "3" })], actors: { s2: { status: "failed", badge: "health check ✕", badgeTone: "rose" } }, edges: { "lb-s2": "failed" } },
    { title: "Traffic rerouted", caption: "After a few failed checks it's marked unhealthy and removed from rotation. Requests 4 and 5 go to App 1 and App 3 — users barely notice.", tokens: [at("d", "processing", "s1", { label: "4" }), at("e", "processing", "s3", { label: "5" })], actors: { s2: { status: "down", badge: "out of rotation" } }, edges: { "lb-s1": "active", "lb-s3": "active", "lb-s2": "muted" }, durationMs: 3000 },
  ],
};
