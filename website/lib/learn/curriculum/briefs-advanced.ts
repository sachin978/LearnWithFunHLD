import type { ConceptBrief } from "./types";

/** Architecture style, edge, coordination, operations and security briefs. */
export const BRIEFS_ADVANCED: ConceptBrief[] = [
  {
    slug: "monolith-microservices",
    title: "Monoliths, layered architecture and microservices",
    shortTitle: "Monolith vs microservices",
    stage: 2,
    minutes: 12,
    summary: "How to structure the server side — one deployable or many — and why microservices are an organisational trade-off as much as a technical one.",
    outcome: "Explain monolith vs microservices trade-offs, when to split a service, and what splitting costs.",
    problem:
      "As a product grows, one codebase gets harder to change safely: deploys get risky, teams step on each other, and one hot feature can't scale on its own. Splitting into services helps — but every network boundary you add brings latency, partial failure and data-consistency problems that didn't exist inside one process.",
    simple:
      "A **monolith** is one deployable application, often organised in layers: API → business logic → data access. **Microservices** split the system into independently deployable services, each owning its data and talking to the others over the network.",
    analogy:
      "A monolith is one big kitchen where every chef shares the same fridge; microservices are separate food stalls, each with its own fridge and menu — more independent, but now they have to phone each other for ingredients.",
    howItWorks: [
      "**Layered monolith:** controllers/API → services (business logic) → repositories (data access) in one process. Calls are function calls — fast, transactional and easy to debug.",
      "**Modular monolith:** one deployable with strict module boundaries, each module owning its own tables. A pragmatic middle ground, and an easy path to extracting services later.",
      "**Microservices:** each service owns its data store and exposes an API (HTTP/gRPC) or publishes events. Teams deploy and scale services independently.",
      "**Cross-service data:** no shared tables. Data moves through APIs or events, so consistency across services becomes eventual unless you coordinate with a **saga** — a sequence of local transactions with compensating actions.",
      "**The infrastructure tax:** service discovery, an API gateway, distributed tracing, per-service CI/CD and on-call — the operational cost of independence.",
    ],
    example: {
      title: "Splitting an e-commerce monolith",
      setup: "A monolith handles catalogue, cart, checkout and notifications. Sale-day traffic hits the catalogue ~50× harder than checkout, and three teams deploy the same codebase every day.",
      steps: [
        "**Measure first:** the catalogue is read-heavy and needs to scale on its own; notifications are slow and flaky; checkout needs strong consistency.",
        "**Extract notifications first:** it's asynchronous by nature, so checkout publishes `order.placed` and a notification service consumes it — a clear boundary, low risk.",
        "**Extract the catalogue next,** behind a cache and a search index, scaled separately from checkout.",
        "**Keep checkout, cart and inventory together** for now: they change together and need transactions — splitting them would require a saga for every order.",
        "**Result:** three deployables instead of one, each owning its data — not twenty services on day one.",
      ],
      takeaway: "Split along boundaries that change, scale or fail independently — and keep things that need transactions together.",
    },
    whenToUse: [
      "Microservices: several teams need to deploy independently, or parts of the system have very different scaling or reliability needs.",
      "A (modular) monolith: small teams, new products, or domain boundaries that aren't clear yet.",
    ],
    whenNotToUse: [
      "Don't start a new product with dozens of services — you pay the distributed-systems tax before you know the right boundaries.",
      "Don't split components that must change together or share transactions.",
    ],
    tradeoffs: {
      pros: ["Independent deploys and scaling", "Fault isolation per service", "Team autonomy and technology choice"],
      cons: ["Network latency and partial failure between services", "No cross-service joins or transactions", "Operational overhead: discovery, tracing, many pipelines"],
      decide: "Start with a modular monolith; extract a service when a boundary needs independent deploys, scaling or failure isolation — and give it its own data.",
    },
    failureModes: [
      "**Distributed monolith:** services that must deploy together or share a database — all the costs of microservices and none of the benefits.",
      "**Chatty call chains:** one request fans out into dozens of synchronous calls; latency adds up and any failure fails the whole request.",
      "**Cascading failure:** one slow service ties up its callers' threads — timeouts, circuit breakers and bulkheads are mandatory.",
      "**Data drift:** event-driven copies of data in several services diverge without idempotent consumers and reconciliation.",
    ],
    explain: {
      prompt: "Explain when you would split a monolith into microservices, and what it costs.",
      keyPoints: [
        "Split for independent deployment, scaling or failure isolation — not by default",
        "Each service owns its data; no shared tables",
        "Costs: network latency, partial failure, eventual consistency, operational overhead",
        "Keep tightly coupled, transactional parts together (or use sagas)",
        "Start with a modular monolith and extract along measured boundaries",
      ],
    },
    interviewAnswer:
      "I'd start with a modular monolith — one deployable with clear module boundaries — because it's simpler to build, test and operate. I'd extract a service when a boundary needs something the monolith can't give it: independent deploys for a separate team, independent scaling like a read-heavy catalogue, or failure isolation like a flaky notification integration. Each extracted service owns its data, so cross-service consistency becomes eventual — handled with events and idempotent consumers, or sagas where a business process spans services. The costs are real: network latency, partial failures, tracing and many pipelines. So I'd split along boundaries that change and fail independently, and keep things that need transactions together.",
    mistakes: [
      {
        weak: "\"We'll use microservices because they scale better.\"",
        why: "A monolith scales horizontally too. Microservices mainly buy independent deployment and per-component scaling, at a significant operational cost.",
        strong: "\"The catalogue gets ~50× more traffic than checkout and has its own team, so it's a separate service; checkout stays with cart and inventory because they share transactions.\"",
      },
      {
        weak: "Splitting into services that all share one database.",
        why: "Shared tables couple services at the data layer: schema changes need coordinated deploys, and you end up with a distributed monolith.",
        strong: "\"Each service owns its tables; others get that data through its API or by consuming its events.\"",
      },
    ],
    questions: [
      { q: "What is a distributed monolith?", short: "Services that are deployed separately but so coupled — shared database, synchronous call chains, lockstep releases — that they can't change or fail independently." },
      { q: "How do you handle a business transaction that spans services?", short: "Avoid it by keeping that data together if you can. Otherwise use a saga: a sequence of local transactions, each publishing an event, with compensating actions (refund, release stock) if a later step fails." },
      { q: "How do services find each other?", short: "Service discovery — a registry or DNS mapping service names to healthy instances — combined with load balancing; platforms like Kubernetes provide it built in." },
    ],
    recap: ["Monolith first (modular); extract when a boundary needs independence.", "Each service owns its data — expect eventual consistency.", "Microservices trade code coupling for network and operational complexity."],
    recall: {
      prompt: "A 6-person team is starting a new product. The interviewer asks whether to start with microservices. Best answer?",
      options: [
        { text: "Yes — microservices are the modern standard", verdict: "weak", why: "Ignores team size and costs; no requirement is driving it." },
        { text: "Start with a modular monolith and extract services when a boundary needs independent deploys, scaling or isolation", verdict: "best", why: "Fits the team and keeps the option to split along boundaries you've actually learned." },
        { text: "One service per database table", verdict: "weak", why: "Creates chatty, tightly coupled services — a distributed monolith." },
        { text: "Split off only clearly asynchronous parts, like notifications, from the start", verdict: "valid", why: "Reasonable if their failure or scaling needs really differ; keep the core together." },
      ],
    },
    prerequisites: ["http-request-flow"],
    deeper: [
      { label: "Reliability patterns between services", href: "/learn/concepts/reliability-patterns", kind: "brief" },
      { label: "API gateways", href: "/learn/concepts/api-gateway", kind: "brief" },
      { label: "Walkthrough: e-commerce backend", href: "/learn/designs/ecommerce", kind: "design" },
    ],
  },

  {
    slug: "api-gateway",
    title: "API gateways and reverse proxies",
    shortTitle: "API gateways",
    stage: 5,
    minutes: 10,
    summary: "A single front door for clients that handles routing, authentication, rate limiting and TLS — and how to stop it becoming a liability.",
    outcome: "Explain what an API gateway does, what belongs in it (and what doesn't), and how to keep it from becoming a bottleneck.",
    problem:
      "With several backend services, clients would need to know every service's address, and every service would re-implement authentication, rate limiting, TLS and logging — slightly differently each time. Changing how services are split would break clients.",
    simple:
      "An API gateway is a reverse proxy in front of your services: clients call one endpoint, and the gateway routes each request to the right service after applying shared policies such as authentication and rate limits.",
    analogy: "A hotel reception desk: guests deal with one desk, which checks their key card and passes requests to housekeeping, the restaurant or maintenance — guests never need to know where those teams sit.",
    howItWorks: [
      "**Routing:** map paths or hosts to services (`/orders/*` → order service, `/users/*` → user service), so internal services can be split or moved without breaking clients.",
      "**Cross-cutting policies:** TLS termination, authentication (verify a token once), rate limiting, request size limits, CORS, logging and tracing headers.",
      "**Reverse proxy vs gateway:** a reverse proxy (e.g. Nginx, Envoy) forwards and load-balances requests; an API gateway adds API-specific features — authentication, quotas, API keys, request transformation.",
      "**Backend for frontend (BFF):** a gateway or thin service tailored to one client type (e.g. mobile) that aggregates several backend calls into one response.",
      "**Placement:** behind a load balancer, as several stateless instances, with routing configuration versioned and deployed like code.",
    ],
    example: {
      title: "Putting a gateway in front of an e-commerce backend",
      setup: "Mobile and web clients call the product, cart, order and user services directly; each service validates tokens and implements rate limiting in its own way.",
      steps: [
        "**Single entry point:** clients now call `api.example.com`; the gateway routes `/products/*`, `/cart/*` and `/orders/*` to their services.",
        "**Authenticate once:** the gateway verifies the token's signature and expiry and forwards the user ID; services still check authorisation for their own resources.",
        "**Rate limit at the edge:** a per-API-key token bucket rejects excess traffic with HTTP 429 before it reaches any service.",
        "**Mobile BFF:** one `/home` call aggregates profile, recommendations and cart count, saving the app three round trips on slow networks.",
        "**Keep business logic out:** the gateway doesn't know what a discount is — that stays in the services.",
      ],
      takeaway: "The gateway owns the cross-cutting edge concerns; services own the business rules.",
    },
    whenToUse: ["Several services behind one public API.", "Consistent authentication, rate limiting and TLS at the edge.", "Different clients that need tailored responses (BFF)."],
    whenNotToUse: [
      "A single monolith behind a load balancer may not need one — the load balancer and framework already cover TLS and routing.",
      "Don't put business logic or heavy orchestration in the gateway.",
    ],
    tradeoffs: {
      pros: ["One stable entry point; services can change behind it", "Shared policies implemented once", "A central place for edge observability"],
      cons: ["An extra hop and another component to scale", "Risk of a bottleneck or single point of failure", "Teams can be blocked by central gateway changes"],
      decide: "Use a gateway for routing and edge policies, run it stateless and redundant, and keep business logic in the services.",
    },
    failureModes: [
      "**Single point of failure:** one gateway instance down means the whole API is down — run several behind a load balancer.",
      "**Gateway as a monolith:** business logic and aggregation creep in until every change needs the gateway team.",
      "**Latency stacking:** gateway + an auth-service call + the service call. Verify tokens locally (signature check) rather than calling an auth service on every request.",
      "**Over-trusting the internal network:** services that accept any internal request can be reached by bypassing the gateway — keep authorisation checks in the services.",
    ],
    explain: {
      prompt: "Explain what an API gateway does in a system with several backend services, and what you'd keep out of it.",
      keyPoints: [
        "A single entry point that routes requests to services by path or host",
        "Edge concerns: TLS, authentication, rate limiting, logging",
        "Lets services change without breaking clients",
        "Stateless and redundant, so it isn't a bottleneck or single point of failure",
        "Business logic stays in the services",
      ],
    },
    interviewAnswer:
      "Clients call one endpoint — the gateway — which routes each request by path to the right service, so we can split or move services without breaking clients. It handles edge concerns once: TLS termination, verifying the auth token, per-client rate limits, request size limits and tracing headers. I'd run it as several stateless instances behind the load balancer so it isn't a single point of failure, verify tokens locally to avoid an extra network call, and keep business logic out of it — services still do their own authorisation. For mobile clients I might add a backend-for-frontend that aggregates a few calls into one.",
    mistakes: [
      {
        weak: "\"The gateway handles authorisation, so services don't need to check anything.\"",
        why: "Authentication fits at the edge, but deciding whether a user may touch a specific resource needs domain knowledge; services that rely only on the gateway can be abused if it's misconfigured or bypassed.",
        strong: "\"The gateway authenticates the token and forwards the user ID; each service checks that the user may access that particular order.\"",
      },
      {
        weak: "Putting checkout orchestration logic into the gateway.",
        why: "The gateway turns into a monolith every team must change, and business rules end up far from the data they protect.",
        strong: "\"The gateway routes /checkout to the order service, which orchestrates payment and inventory.\"",
      },
    ],
    questions: [
      { q: "API gateway vs load balancer?", short: "A load balancer spreads traffic across instances of a service. An API gateway sits at the edge of many services and adds API concerns — path routing, authentication, quotas, transformations. They're often used together." },
      { q: "What is a backend for frontend (BFF)?", short: "A thin API layer tailored to one client type (e.g. mobile) that aggregates and shapes data from several services, so clients make fewer, simpler calls." },
      { q: "How do you stop the gateway becoming a bottleneck?", short: "Keep it stateless and horizontally scaled, keep heavy work out of it, verify tokens locally, and give teams self-service route configuration." },
    ],
    recap: ["One entry point; routing by path or host.", "Edge concerns live here: TLS, authentication, rate limits, logging.", "Stateless and redundant; no business logic."],
    recall: {
      prompt: "Every service validates tokens with slightly different code, and one forgot to check expiry. What's the best fix?",
      options: [
        { text: "Verify tokens once in an API gateway and forward the verified user ID; services keep resource-level authorisation", verdict: "best", why: "Removes duplicated, inconsistent authentication while keeping authorisation where the domain knowledge lives." },
        { text: "Move all authorisation rules into the gateway", verdict: "weak", why: "Resource-level rules need domain data; the gateway would become a business-logic monolith." },
        { text: "Use a shared authentication library in every service", verdict: "valid", why: "Also reduces drift, but every service still needs redeploying for each change; a gateway centralises it." },
      ],
    },
    prerequisites: ["load-balancing"],
    deeper: [
      { label: "Rate limiting (reliability patterns)", href: "/learn/concepts/reliability-patterns", kind: "brief" },
      { label: "Security fundamentals", href: "/learn/concepts/security-fundamentals", kind: "brief" },
      { label: "Walkthrough: rate limiter", href: "/learn/designs/rate-limiter", kind: "design" },
    ],
  },

  {
    slug: "distributed-locks",
    title: "Distributed locks, leases and fencing tokens",
    shortTitle: "Distributed locks",
    stage: 7,
    minutes: 12,
    summary: "How to make sure only one process does something at a time across machines — and why a lock on its own isn't enough.",
    outcome: "Explain when you need a distributed lock, how leases and fencing tokens make it safe, and when to avoid locks entirely.",
    problem:
      "Some work must only happen once at a time: one worker running the nightly billing job, one leader writing to a shared resource. Inside one process a mutex does this. Across machines, a process can crash, pause or lose the network while holding a lock — and then carry on as if it still owns it.",
    simple:
      "A distributed lock is a record in a shared, reliable store saying \"process A owns resource X until time T\". Others wait or skip. Because owners can die, locks expire (a **lease**); because an expired owner can wake up and keep going, writes must be checked with a **fencing token**.",
    analogy:
      "A study room booked for one hour. If you fall asleep inside and wake up after your hour, someone else may now have the room — so the room's computer checks that your booking number is the latest before letting you save anything.",
    howItWorks: [
      "**Acquire with a lease:** atomically create the lock with an owner ID and an expiry — e.g. Redis `SET lock:job owner-42 NX PX 30000`, or a lease in etcd/ZooKeeper. If it already exists, someone else holds it.",
      "**Renew while working:** long tasks extend the lease periodically; if renewal fails, stop working.",
      "**Release safely:** delete the lock only if you still own it (compare the owner ID atomically, e.g. with a Lua script) — never delete someone else's lock.",
      "**Fencing tokens:** every successful acquisition gets a monotonically increasing number; the protected resource rejects writes carrying a lower token than the highest it has seen, so a paused process with an expired lease can't corrupt data.",
      "**Pick the store by safety needs:** a single Redis instance is fine for efficiency locks (avoiding duplicate work). For correctness-critical locks, use a consensus-based store (etcd, ZooKeeper) together with fencing.",
      "**Often better: no lock at all.** Atomic conditional updates (`UPDATE … WHERE version = 7`), unique constraints, idempotency keys, or partitioning work so each item has exactly one owner.",
    ],
    example: {
      title: "One nightly billing run across five servers",
      setup: "Five scheduler instances fire the same job at 02:00. Billing must run once; a run takes about 10 minutes.",
      steps: [
        "Each instance tries `SET lock:billing:2026-10-21 <instance-id> NX PX 60000`. Exactly one succeeds; the others skip.",
        "The winner renews its 60 s lease every 20 s while billing runs.",
        "A long pause (e.g. garbage collection) stalls the winner for 90 s. Its lease expires and another instance acquires the lock with fencing token 8 (the first had 7).",
        "The first instance wakes up and writes invoices with token 7. The billing store only accepts tokens ≥ 8 for this run, so those writes are rejected.",
        "**Even better:** make each invoice write idempotent with a unique `(customer_id, period)` key, so duplicate work can't double-bill anyone, lock or no lock.",
      ],
      takeaway: "Leases handle crashed owners, fencing tokens handle paused ones, and idempotent writes make the remaining edge cases harmless.",
    },
    whenToUse: ["Making sure a scheduled job runs on only one instance.", "Serialising access to an external resource that can't do conditional updates.", "Leader election for a single active worker."],
    whenNotToUse: [
      "When the database can enforce it — use unique constraints, conditional updates or transactions instead.",
      "On high-throughput paths: a lock per request serialises everything and adds a network round trip.",
    ],
    tradeoffs: {
      pros: ["A simple mental model for mutual exclusion", "Prevents wasted duplicate work"],
      cons: ["Safety depends on timing assumptions (pauses, clocks)", "The lock store becomes a dependency and possible bottleneck", "Lease length is a trade-off: too short splits ownership, too long slows recovery"],
      decide: "Prefer data-level guarantees (constraints, conditional writes, idempotency); use leases for efficiency, and leases + fencing tokens on a consensus store when correctness depends on the lock.",
    },
    failureModes: [
      "**A pause longer than the lease** (GC, VM migration): two processes believe they hold the lock.",
      "**Releasing someone else's lock** after your own lease expired — always compare the owner ID atomically.",
      "**Lock store failover:** with asynchronous replication, a lock taken on the old primary can vanish after failover.",
      "**Clock assumptions:** lease logic that depends on synchronised wall clocks across machines breaks under clock drift.",
    ],
    explain: {
      prompt: "Explain how you'd make sure a nightly job runs only once across five servers, and what can still go wrong.",
      keyPoints: [
        "Acquire a lock atomically with an owner ID and an expiry (a lease)",
        "Renew the lease while working; stop if renewal fails",
        "Release only if you still own it",
        "Fencing tokens so a paused former owner can't write",
        "Idempotent work so a duplicate run is harmless",
      ],
    },
    interviewAnswer:
      "Each server tries to take a lease — for example SET with NX and a 60-second expiry in Redis, storing its own ID — and only the winner runs the job, renewing the lease while it works. The lease means a crashed owner doesn't block the job forever. The tricky case is a process that pauses longer than its lease and then carries on, so for correctness I'd add a fencing token: every acquisition gets an increasing number, and the store rejects writes with a stale token. If correctness truly matters I'd keep the lock in a consensus store like etcd, and I'd still make the job idempotent — a unique key per customer and billing period — so a duplicate run can't double-bill anyone.",
    mistakes: [
      {
        weak: "\"Use a Redis lock and the problem is solved.\"",
        why: "A lease can expire while its owner is paused; without fencing or idempotent writes, two processes can both act as the owner.",
        strong: "\"A Redis lease prevents most duplicate runs; fencing tokens and an idempotent write make the rare overlap harmless.\"",
      },
      {
        weak: "Taking a distributed lock around every seat booking.",
        why: "It funnels every booking through one lock service and adds latency, when the database can guarantee it atomically.",
        strong: "\"`UPDATE seats SET holder = ? WHERE seat_id = ? AND holder IS NULL` — the database ensures only one booking succeeds.\"",
      },
    ],
    questions: [
      { q: "What is a fencing token?", short: "A monotonically increasing number issued with each lock acquisition. The protected resource rejects requests carrying a lower token than one it has already seen, so a stale lock holder can't write." },
      { q: "Why do distributed locks need an expiry?", short: "The holder may crash or lose the network, and the lock would never be released. Expiry creates the opposite risk — a slow holder outliving its lease — which fencing tokens address." },
      { q: "Redis or etcd/ZooKeeper for locks?", short: "A single Redis node is fine for efficiency locks (avoiding duplicate work). For correctness-critical locks, consensus-based stores like etcd or ZooKeeper give stronger guarantees, combined with fencing." },
    ],
    recap: ["Lease = a lock with an expiry; renew while working.", "Release only your own lock; fence writes with increasing tokens.", "Prefer constraints, conditional writes and idempotency when you can."],
    recall: {
      prompt: "Two workers sometimes both run the same nightly job, despite a Redis lock with a 30 s expiry. The job can take 2 minutes. Most likely cause and fix?",
      options: [
        { text: "Redis is losing writes — switch databases", verdict: "weak", why: "The behaviour is explained by the lease expiring mid-job, not by data loss." },
        { text: "The lease expires mid-job: renew it while working, fence writes with tokens, and make the job idempotent", verdict: "best", why: "Fixes the root cause (lease shorter than the work) and the residual risk (pauses)." },
        { text: "Increase the lease to 10 minutes", verdict: "valid", why: "Reduces overlap, but a crashed worker then blocks the job for 10 minutes, and a long pause can still exceed it." },
      ],
    },
    prerequisites: ["reliability-patterns", "cap-consistency"],
    deeper: [
      { label: "CAP & consistency", href: "/learn/concepts/cap-consistency", kind: "brief" },
      { label: "Walkthrough: e-commerce (preventing oversells without locks)", href: "/learn/designs/ecommerce", kind: "design" },
      { label: "Quorums and leader election (RabbitMQ ch. 9)", href: "/learn/rabbitmq#queue-types", kind: "course" },
    ],
  },

  {
    slug: "observability",
    title: "Observability: metrics, logs, traces and SLOs",
    shortTitle: "Observability & SLOs",
    stage: 9,
    minutes: 14,
    summary: "How you know a system is healthy, find out why it isn't, and decide how reliable it actually needs to be.",
    outcome: "Choose metrics and alerts for a service, debug a slow request with traces and logs, and define SLIs, SLOs and error budgets.",
    problem:
      "In a distributed system, one slow request may touch a gateway, five services, a cache and two databases. Without telemetry you learn about outages from users, and you can't tell which component caused them. Interviewers ask \"how would you know it's broken?\" to see whether you design for operation, not just the happy path.",
    simple: "**Metrics** tell you something is wrong, **traces** show where in the request path it's wrong, and **logs** explain why. **SLOs** say how reliable the service must be, so you alert on what users actually feel.",
    analogy: "A car's dashboard (metrics) warns that the engine is overheating; the mechanic's diagnostic (a trace) shows which part failed; the service history (logs) records exactly what happened and when.",
    howItWorks: [
      "**Metrics:** cheap numeric time series. For request-driven services, track **RED** — Rate, Errors, Duration (as percentiles: p50, p95, p99, not just averages). For resources, **USE** — Utilisation, Saturation, Errors.",
      "**Logs:** structured (e.g. JSON) events with context such as request ID and error details. Searchable but costly at volume — sample noisy debug logs and keep personal data out.",
      "**Distributed tracing:** a trace ID is propagated through every hop (e.g. the W3C `traceparent` header); each service records timed spans, so you can see which hop added the latency.",
      "**SLI / SLO / SLA:** an SLI is a measurement (% of requests faster than 300 ms); an SLO is your internal target (99.9% over 30 days); an SLA is a contractual promise with penalties, usually looser than the SLO.",
      "**Error budget:** a 99.9% availability SLO allows about 43 minutes of failure per 30 days. Burning it quickly is the signal to slow releases and fix reliability.",
      "**Alerting:** page on user-visible symptoms (error rate, latency, SLO burn rate); send causes like CPU spikes to dashboards instead.",
    ],
    example: {
      title: "Debugging a slow checkout",
      setup: "Checkout p99 latency jumps from 400 ms to 3 s shortly after a deploy. The error rate is unchanged.",
      steps: [
        "**Metrics:** p99 is up only for `POST /checkout`, starting at 14:05 — the deploy time.",
        "**Traces:** for slow requests, the inventory service span takes 2.5 s; every other span is unchanged.",
        "**Logs:** inventory logs, filtered by trace ID, show a new query doing a full table scan — the new migration forgot an index.",
        "**Fix:** roll back (or add the index); p99 returns to ~400 ms.",
        "**SLO view:** the latency SLO (99% of checkouts under 1 s) burned ~30% of its monthly error budget in an hour — that, not a CPU graph, is what paged the on-call engineer.",
      ],
      takeaway: "Metrics found the symptom, traces found the component, logs found the cause — and the SLO decided it was worth waking someone up.",
    },
    whenToUse: ["Every production service: RED metrics, structured logs with request IDs, and traces across service boundaries.", "SLOs for user-facing journeys — login, checkout, loading the feed."],
    whenNotToUse: ["Don't alert on every metric — alert fatigue makes real incidents easy to miss.", "Don't log full request bodies or personal data by default."],
    tradeoffs: {
      pros: ["Faster detection and diagnosis", "Data for capacity planning", "Explicit, shared reliability targets"],
      cons: ["Storage and processing cost of telemetry", "Instrumentation effort and cardinality pitfalls", "Privacy risk if logs capture sensitive data"],
      decide: "Instrument RED metrics and tracing everywhere, sample logs and traces sensibly, and page only on SLO-based symptoms.",
    },
    failureModes: [
      "**Averages hide pain:** mean latency looks fine while p99 is terrible — always look at percentiles.",
      "**Cardinality explosion:** labelling metrics with user IDs creates millions of time series and overwhelms the metrics store.",
      "**Broken context propagation:** one service that drops the trace header breaks every trace passing through it.",
      "**Alert fatigue:** noisy, cause-based alerts get ignored until a real outage is missed.",
    ],
    explain: {
      prompt: "Explain how you'd know your checkout service is unhealthy, and how you'd find the cause of a latency spike.",
      keyPoints: [
        "RED metrics: rate, errors, latency percentiles",
        "Alerts on symptoms tied to an SLO, not on every cause",
        "Distributed tracing to find the slow hop",
        "Structured logs with request/trace IDs to find the cause",
        "Error budgets to decide urgency and release pace",
      ],
    },
    interviewAnswer:
      "I'd instrument every service with RED metrics — request rate, error rate and latency percentiles — and define SLOs for the key journeys, like 99.9% of checkouts succeeding and 99% finishing within a second. Alerts fire on symptoms, such as the error budget burning too fast, rather than on CPU. To debug a latency spike I'd go from metrics to traces: a trace ID propagated through every hop shows which service's span got slow. Then structured logs filtered by that trace ID explain why — say, a query doing a full scan after a deploy. The error budget also tells us whether to pause releases and focus on reliability.",
    mistakes: [
      {
        weak: "\"We'll monitor CPU and memory.\"",
        why: "Those are causes, not what users feel; a service can be broken at 20% CPU — for example when a dependency is failing.",
        strong: "\"Page on checkout error rate and p99 latency against the SLO; CPU and memory go on dashboards for diagnosis.\"",
      },
      {
        weak: "\"Average latency is 120 ms, so performance is fine.\"",
        why: "Averages hide the tail: 1% of users waiting 5 s barely moves the mean, and the slowest requests often belong to your heaviest users.",
        strong: "\"p50 is 120 ms but p99 is 2 s — let's trace the slow tail.\"",
      },
    ],
    questions: [
      { q: "What's the difference between an SLO and an SLA?", short: "An SLO is an internal reliability target (e.g. 99.9% monthly availability); an SLA is a contractual commitment with penalties, usually set looser than the SLO to leave margin." },
      { q: "Why use percentiles rather than averages for latency?", short: "Latency distributions have long tails; percentiles like p95 and p99 show what the slowest users experience, which averages hide." },
      { q: "How does distributed tracing work?", short: "A trace ID (plus a parent span ID) travels in request headers through every service; each service records timed spans, and a tracing backend assembles them into one timeline per request." },
    ],
    recap: ["Metrics → something's wrong; traces → where; logs → why.", "RED for services; percentiles, not averages.", "SLOs and error budgets drive alerting and release pace."],
    recall: {
      prompt: "Users report slow pages, but your dashboard shows average latency at a healthy 150 ms and CPU at 30%. What do you check first?",
      options: [
        { text: "Nothing — the metrics look healthy", verdict: "weak", why: "Averages and CPU can look fine while the tail is slow." },
        { text: "p95/p99 latency, then traces of slow requests to find the slow hop", verdict: "best", why: "Users feel the tail, and traces show which component adds the delay." },
        { text: "Add more servers", verdict: "weak", why: "30% CPU suggests the servers aren't the bottleneck; scaling blindly may change nothing." },
        { text: "Check error rates and recent deploys", verdict: "valid", why: "Useful context — combine it with tail latency and traces." },
      ],
    },
    prerequisites: ["http-request-flow", "reliability-patterns"],
    deeper: [
      { label: "Reliability patterns", href: "/learn/concepts/reliability-patterns", kind: "brief" },
      { label: "Monitoring queue backlogs (RabbitMQ ch. 8)", href: "/learn/rabbitmq#scaling", kind: "course" },
    ],
  },

  {
    slug: "security-fundamentals",
    title: "Security fundamentals: TLS, authentication, authorisation and API protection",
    shortTitle: "Security fundamentals",
    stage: 10,
    minutes: 14,
    summary: "The security questions every design faces: encrypting traffic, proving who users are, deciding what they may do, protecting APIs from abuse and keeping secrets secret.",
    outcome: "Explain TLS, authentication vs authorisation, sessions vs tokens, common API protections and secrets handling in a design.",
    problem:
      "Security usually arrives as a follow-up: \"How do users log in?\", \"What stops someone reading another user's orders?\", \"Where do your database credentials live?\". Weak answers bolt security on at the end; strong answers show where each control sits in the request path.",
    simple:
      "Encrypt everything in transit (TLS), verify **who** is calling (authentication), check **what** they may do on every request (authorisation), limit and validate what they send (API protection), and keep credentials out of code (secrets management).",
    analogy:
      "An office building: a sealed courier envelope (TLS), a badge check at the door (authentication), door permissions per floor (authorisation), a guard limiting visitors and scanning bags (rate limits and validation), and keys kept in a safe rather than taped under desks (secrets).",
    howItWorks: [
      "**TLS (HTTPS):** encrypts and authenticates connections using certificates. Terminate it at the load balancer or gateway, and use TLS (or mutual TLS) between services where the internal network isn't fully trusted.",
      "**Sessions vs tokens:** server-side sessions keep state in a shared store and give the browser an opaque cookie — easy to revoke. Signed tokens such as JWTs carry claims and can be verified without a lookup, but are hard to revoke before they expire — keep them short-lived and pair them with refresh tokens.",
      "**Delegated login:** OAuth 2.0 / OpenID Connect let users sign in through an identity provider; your services verify tokens instead of handling passwords.",
      "**Authorisation:** check permissions on every request, close to the data — \"may user 42 read order 1001?\". Missing per-object checks (broken object-level authorisation, also called IDOR) are among the most common real-world vulnerabilities.",
      "**API protection:** rate limits per client, input validation and size limits, parameterised queries (no SQL injection), and least-privilege API keys.",
      "**Secrets and data at rest:** credentials live in a secrets manager or vault, injected at runtime and rotated — never in code or images. Encrypt sensitive data at rest; hash passwords with a slow, salted algorithm (bcrypt, scrypt, Argon2).",
    ],
    example: {
      title: "Securing \"view my order\"",
      setup: "A mobile app calls `GET /orders/1001`. The system has a load balancer, a gateway, an order service and a database.",
      steps: [
        "**In transit:** TLS terminates at the load balancer; the gateway → service hop uses internal TLS.",
        "**Authentication:** the app sends a short-lived access token from an OpenID Connect login; the gateway verifies its signature and expiry and forwards the user ID.",
        "**Authorisation:** the order service loads order 1001 and checks that `order.user_id` is the caller (or that the caller has a support role) — otherwise it returns 404 rather than someone else's data.",
        "**Abuse:** a per-client rate limit at the gateway slows anyone enumerating order IDs; random UUIDs instead of sequential IDs help too, but never replace the check.",
        "**Secrets:** the order service reads its database password from a secrets manager at startup, and the password is rotated without changing code.",
      ],
      takeaway: "Each control sits where it belongs: encryption on the wire, identity at the edge, permissions next to the data.",
    },
    whenToUse: [
      "Every design: TLS everywhere, authentication at the edge, authorisation on every resource access.",
      "Signed tokens for stateless verification across many services; server-side sessions when instant revocation matters most.",
    ],
    whenNotToUse: ["Don't invent your own cryptography or password-storage scheme.", "Don't put secrets in tokens, URLs, logs or client-side code."],
    tradeoffs: {
      pros: ["Defence in depth limits the blast radius of a single failure", "Standard protocols (TLS, OIDC) are well tested"],
      cons: ["JWTs are fast to verify but hard to revoke", "mTLS and fine-grained authorisation add operational complexity", "Strict limits can block legitimate heavy users"],
      decide: "Use standard protocols, short-lived tokens, per-request authorisation next to the data, and secrets from a managed store.",
    },
    failureModes: [
      "**Broken object-level authorisation (IDOR):** the API trusts the ID in the URL and returns another user's data.",
      "**Long-lived tokens leak:** a stolen token stays valid until it expires — keep lifetimes short and support revocation for sensitive actions.",
      "**Secrets in code or logs** leak through repositories, container images and log pipelines.",
      "**No rate limit on login:** credential-stuffing attacks try millions of leaked username/password pairs.",
    ],
    explain: {
      prompt: "Explain how your system makes sure a user can only see their own orders.",
      keyPoints: [
        "TLS protects the request in transit",
        "Authenticate the caller (session or verified token) at the edge",
        "Authorise per object: compare the order's owner with the caller, in the service",
        "Rate limits and non-guessable IDs deter enumeration",
        "Never rely on the gateway or hidden IDs alone",
      ],
    },
    interviewAnswer:
      "All traffic uses TLS. Users sign in through an identity provider with OpenID Connect and get a short-lived access token; the gateway verifies the token's signature and expiry and forwards the user ID. The important part is authorisation: the order service loads the order and checks that its owner is the caller — or that the caller has a support role — and returns not-found otherwise, because trusting the ID in the URL is the classic broken-access-control bug. On top of that, per-client rate limits slow down anyone trying to enumerate IDs, and service credentials come from a secrets manager rather than config files.",
    mistakes: [
      {
        weak: "\"Users are logged in, so they can call the orders endpoint.\"",
        why: "Authentication proves who someone is, not which records they may see — without per-object checks any logged-in user can read any order by changing the ID.",
        strong: "\"Every order read checks order.user_id against the caller; support staff get access through an explicit role.\"",
      },
      {
        weak: "\"Our JWTs last 30 days so users don't have to log in again.\"",
        why: "A leaked token stays valid for a month and is hard to revoke.",
        strong: "\"15-minute access tokens plus a refresh token that can be revoked server-side.\"",
      },
    ],
    questions: [
      { q: "Authentication vs authorisation?", short: "Authentication establishes who the caller is (login, token verification); authorisation decides what that caller may do with a specific resource." },
      { q: "Sessions or JWTs?", short: "Sessions are easy to revoke but need a shared session store; JWTs verify without a lookup and suit many services, but are hard to revoke — keep them short-lived with refresh tokens." },
      { q: "How should passwords be stored?", short: "Never in plain text or with a fast hash: use a slow, salted password-hashing algorithm such as bcrypt, scrypt or Argon2 — or delegate login to an identity provider." },
    ],
    recap: ["TLS in transit; secrets in a manager; passwords hashed slowly.", "Authenticate at the edge; authorise every object next to the data.", "Short-lived tokens; rate-limit login and enumeration."],
    recall: {
      prompt: "A user changes the URL from /orders/1001 to /orders/1002 and sees someone else's order. What's the root cause?",
      options: [
        { text: "The order IDs are sequential", verdict: "valid", why: "It makes guessing easy, but random IDs alone wouldn't fix the real bug." },
        { text: "Missing object-level authorisation: the service never checks that the order belongs to the caller", verdict: "best", why: "The server must verify ownership (or a role) on every access, whatever the ID looks like." },
        { text: "The connection isn't using TLS", verdict: "weak", why: "TLS protects data in transit; it doesn't decide who may read which record." },
        { text: "The token expired", verdict: "weak", why: "An expired token would be rejected; the problem is what an authenticated user is allowed to access." },
      ],
    },
    prerequisites: ["http-request-flow", "api-gateway"],
    deeper: [
      { label: "API gateways", href: "/learn/concepts/api-gateway", kind: "brief" },
      { label: "Rate limiting (reliability patterns)", href: "/learn/concepts/reliability-patterns", kind: "brief" },
      { label: "Walkthrough: rate limiter", href: "/learn/designs/rate-limiter", kind: "design" },
    ],
  },
];
