import type { ConceptBrief } from "./types";

/** Interview method + web/backend/data fundamentals. */
export const BRIEFS_CORE: ConceptBrief[] = [
  {
    slug: "interview-framework",
    title: "The system design interview framework",
    shortTitle: "The interview framework",
    stage: 11,
    minutes: 15,
    summary: "A repeatable 7-step approach for any unfamiliar design question, and how to pace a 45-minute interview.",
    outcome: "Structure any unfamiliar design question into 7 steps and pace a 45-minute interview.",
    problem:
      "Most candidates who struggle don't lack knowledge. They jump straight to drawing boxes, design for requirements nobody asked for, run out of time before the interesting part, or never explain **why** they chose anything. Interviewers grade the process — how you break down an ambiguous problem and defend decisions — as much as the final diagram.",
    simple:
      "Treat the interview as a structured conversation: agree on what you're building, size it, define the interface, sketch the big picture, zoom into the hard parts, then stress-test it and discuss alternatives. Check in with the interviewer at each step.",
    analogy: "An architect doesn't pour concrete before asking how many people will live in the house. Requirements first, blueprint second, details last.",
    howItWorks: [
      "**1. Clarify requirements (~5 min):** functional (what users do) and non-functional (scale, latency, availability, consistency, durability). Say what's out of scope and confirm it.",
      "**2. Define scale (~5 min):** users, requests per second, read/write ratio, storage per year. Round aggressively — you need the order of magnitude, because it decides which components are justified.",
      "**3. APIs & data model (~5 min):** the few endpoints that matter and the core entities with their access patterns. This anchors everything that follows.",
      "**4. High-level architecture (~10 min):** clients → load balancer → services → data stores, plus caches and queues only where a requirement or number justifies them. Walk one request end to end.",
      "**5. Deep dives (~10 min):** pick the 1–2 hardest parts — often where the interviewer nudges you — and go deep: data partitioning, caching strategy, consistency, hot spots.",
      "**6. Bottlenecks & failures (~5 min):** what breaks first at 10× load? What happens when a node, a dependency or a whole region fails?",
      "**7. Trade-offs & alternatives (throughout):** say what you chose, what you rejected, and what would make you change your mind. A reusable shape: **the decision → the requirement or number behind it → the cost you accept → how you contain that cost → what would change your mind.**",
    ],
    example: {
      title: "The first 10 minutes of \"Design Instagram\"",
      setup: "The interviewer says \"Design Instagram\" and you have 45 minutes.",
      steps: [
        "**Scope (2 min):** \"I'll focus on posting photos, following users and the home feed. Stories, DMs and search are out of scope unless you'd like them.\"",
        "**Non-functional (2 min):** \"The feed should load in under ~300 ms; a new post can take a few seconds to reach followers; uploaded photos must never be lost.\"",
        "**Scale (3 min):** \"Assume 500M daily users and 1 upload per 10 users per day: 50M photos/day ≈ 600 uploads/s. Each user opens the feed ~10×/day: 5B reads/day ≈ 60k/s.\"",
        "**API (2 min):** `POST /photos`, `GET /feed?cursor=`, `POST /follow/{user_id}`.",
        "**Checkpoint:** \"Reads outnumber writes about 100 to 1, so the design will optimise the feed read path. Shall I sketch the high-level architecture?\"",
      ],
      takeaway: "In under 10 minutes you've agreed on scope, produced numbers that justify later choices, and handed the interviewer a natural moment to redirect you.",
    },
    whenToUse: ["Every open-ended design question (\"Design X\").", "Even when the interviewer drives the conversation — use it to keep yourself oriented and to notice which steps you skipped."],
    whenNotToUse: ["Don't recite it mechanically. If the interviewer wants to skip to a deep dive, follow them — the framework is a guide, not a script."],
    tradeoffs: {
      pros: ["Prevents designing for the wrong problem", "Makes your reasoning visible and easy to follow", "Keeps time under control"],
      cons: ["Over-investing in requirements leaves no time for depth — keep early steps brisk"],
      decide: "Spend roughly a third of the time on steps 1–3 and two thirds on architecture, deep dives and trade-offs.",
    },
    failureModes: [
      "**Running out of time before the deep dive:** 15 minutes on requirements. Time-box steps 1–3 to ~12 minutes and say \"I'll come back to this if we have time.\"",
      "**Designing the wrong system:** the interviewer wanted the feed; you designed photo storage. Confirm scope out loud and ask \"What would you like me to focus on?\"",
      "**Freezing on an unfamiliar technology:** describe the property you need (\"a durable, partitioned, replayable log\") instead of a product name.",
      "**Over-engineering:** multi-region sharding for 10k users. Tie every component to a requirement or a number.",
    ],
    explain: {
      prompt: "In your own words: how would you spend the first 10 minutes of a 45-minute design interview, and why?",
      keyPoints: [
        "Clarify the functional scope and say what's out of scope",
        "Ask about non-functional needs: scale, latency, availability, consistency",
        "Estimate scale so later decisions can be justified",
        "Sketch the key APIs and data before the architecture",
        "Check in with the interviewer before moving on",
      ],
    },
    interviewAnswer:
      "I'll start by clarifying what we're building and for whom — the core features, what's out of scope, and the non-functional requirements like scale, latency and consistency. Then a quick estimate: requests per second, read/write ratio and storage, because those numbers decide whether I need caching, sharding or queues. Next I'll sketch the main APIs and data model, then a high-level architecture, walking one request end to end. After that I'd like to deep-dive into the hardest part, discuss bottlenecks and failures, and explain the trade-offs. I'll check in with you at each step in case you'd like me to focus elsewhere.",
    mistakes: [
      {
        weak: "\"I'd use NoSQL because it scales better.\"",
        why: "No requirement behind it, no cost and no alternative. The interviewer will ask \"better than what, for which workload?\" — and you'll be inventing the reasoning on the spot.",
        strong: "\"Redirects are lookups by short code at ~10k reads/s, so a key-value store fits and scales by adding nodes. We give up ad-hoc queries and joins, which redirects don't need — click analytics go to a separate store. If we needed rich queries over links, I'd revisit this.\"",
      },
      {
        weak: "\"We'll use Kafka, Redis and Cassandra.\" — technology before requirements.",
        why: "No requirement or number exists yet, so none of these choices can be justified. Interviewers read it as pattern-matching rather than reasoning.",
        strong: "\"Reads outnumber writes about 100:1 and timelines must load in under 200 ms, so I'll precompute timelines and cache them.\"",
      },
      {
        weak: "Silently drawing for 10 minutes.",
        why: "The interviewer can't see your reasoning or steer you, and long silence reads as uncertainty.",
        strong: "Narrate decisions as you draw and check in: \"Does this match what you had in mind?\"",
      },
    ],
    questions: [
      {
        q: "What non-functional requirements should you always ask about?",
        short: "Scale (users, QPS, data size), latency targets, availability, consistency needs and durability.",
        detailed: ["When the interviewer says \"you decide\", state assumptions explicitly — e.g. \"I'll assume 100M DAU and that a few seconds of staleness in the feed is fine.\""],
      },
      { q: "The interviewer says \"design Twitter\". What's your first move?", short: "Narrow the scope: which features (post, follow, timeline?), at what scale, and what matters most — usually timeline read latency." },
      {
        q: "A new requirement appears halfway through. What do you do?",
        short: "Acknowledge it, explain how it changes the design, and adapt the affected component rather than starting over — evolving a design under new constraints is exactly what's being tested.",
      },
      {
        q: "How do you present a trade-off so it sounds like a decision, not a guess?",
        short: "Name the decision, the requirement or number that drives it, the cost you accept, how you contain that cost, and what would make you change your mind.",
        detailed: [
          "Example: \"I'll fan out new posts to followers' feeds on write, because reads outnumber writes about 100:1 and the feed must load fast. The cost is huge write bursts for accounts with millions of followers, so for those I'll merge their posts in at read time instead. If reads and writes were closer to even, I'd reconsider.\"",
        ],
      },
    ],
    recap: ["Requirements → scale → API/data → architecture → deep dives → failures → trade-offs.", "Narrate the why behind each decision.", "Keep the first three steps short; spend time where it's hard."],
    recall: {
      prompt: "You're 3 minutes into \"Design a URL shortener\". What should you do next?",
      options: [
        { text: "Pick a database (e.g. Cassandra) and explain why", verdict: "weak", why: "Choosing technology before you know the read/write ratio or scale is premature." },
        { text: "Confirm features and estimate scale: URLs per day, read/write ratio, retention", verdict: "best", why: "Those numbers decide storage size, caching strategy and ID length." },
        { text: "Draw the full architecture with every component", verdict: "weak", why: "Without requirements you can't justify any component." },
        { text: "Ask which features are in scope (custom aliases? analytics? expiry?)", verdict: "valid", why: "Part of clarifying requirements — combine it with the scale estimate." },
      ],
    },
    prerequisites: [],
    deeper: [
      { label: "Back-of-the-envelope estimation", href: "/learn/concepts/estimation", kind: "brief" },
      { label: "APIs & data modeling", href: "/learn/concepts/api-data-modeling", kind: "brief" },
      { label: "Walkthrough: URL shortener", href: "/learn/designs/url-shortener", kind: "design" },
      { label: "Timed mock interview in the simulator", href: "/simulator", kind: "simulator" },
    ],
  },

  {
    slug: "estimation",
    title: "Back-of-the-envelope estimation",
    shortTitle: "Capacity estimation",
    stage: 11,
    minutes: 12,
    summary: "Turn users into requests per second, storage and bandwidth in a few minutes — and use the numbers to justify (or rule out) design choices.",
    outcome: "Derive QPS, peak load, storage and bandwidth from a few assumptions, and use them to justify or rule out components.",
    problem:
      "A design for 1,000 users and one for 100 million look completely different. Without numbers you can't tell whether you need sharding, caching, a CDN or just one database — and the interviewer can't tell whether you can either.",
    simple: "State a few assumptions (users, actions per user, data size), multiply, divide by the seconds in a day, and round everything to powers of ten. Then say what the numbers imply.",
    howItWorks: [
      "**Requests per second:** daily active users × actions per user per day ÷ ~10⁵ (a day is 86,400 s). 100M users × 10 reads ≈ 10⁹ reads/day ÷ 10⁵ ≈ **10,000 reads/s**.",
      "**Peak:** traffic is bursty, so size for peak — 2–3× the average is a common starting assumption.",
      "**Read/write ratio:** decides whether to optimise reads (caches, replicas) or writes (partitioning, queues).",
      "**Storage:** writes per day × bytes per item × retention, then × replication factor (often 3). 1M items/day × 1 KB × 365 × 5 years ≈ **1.8 TB** before replication.",
      "**Bandwidth:** requests/s × response size. 10,000/s × 100 KB = **1 GB/s** — a signal for a CDN.",
      "**Powers of ten:** KB 10³, MB 10⁶, GB 10⁹, TB 10¹², PB 10¹⁵ bytes; 1 day ≈ 10⁵ s; 1 year ≈ 3 × 10⁷ s. Memory read ~100 ns, SSD read ~100 µs, cross-continent round trip ~100–200 ms.",
    ],
    example: {
      title: "Sizing a photo-sharing service",
      setup: "Assume 10M daily users, each viewing 50 photos and uploading 0.2 photos a day. Average photo 2 MB (full size). Keep everything for 5 years.",
      steps: [
        "**Reads:** 10M × 50 = 5 × 10⁸ views/day ÷ 10⁵ ≈ **5,000 views/s** average; × 3 for peak ≈ **15,000/s**.",
        "**Writes:** 10M × 0.2 = 2 × 10⁶ uploads/day ÷ 10⁵ ≈ **20 uploads/s**. Read:write ≈ 250:1.",
        "**Storage:** 2 × 10⁶ × 2 MB = 4 TB/day; × 365 × 5 ≈ **7.3 PB** before replication.",
        "**Bandwidth out:** 5,000 views/s × 2 MB = **10 GB/s** average (thumbnails would cut this a lot) — far beyond what app servers should stream.",
        "**What it implies:** photos in object storage behind a CDN; metadata (a few hundred bytes per photo) in a database; caching on the read path.",
      ],
      takeaway: "A few minutes of arithmetic decided three architectural choices: object storage, a CDN and a separate metadata database.",
    },
    lab: "estimation",
    whenToUse: ["Right after requirements, to decide whether scale features are needed at all.", "Whenever you justify a component: \"15k reads/s on hot keys → cache.\""],
    whenNotToUse: ["Don't chase precision. Orders of magnitude are enough; 86,400 vs 100,000 never changes a design decision."],
    tradeoffs: {
      pros: ["Grounds every later decision", "Shows engineering judgement", "Rules out over-engineering"],
      cons: ["Over-precision wastes time and invites arithmetic slips"],
      decide: "State assumptions out loud, round to 10ⁿ, write units on every line, and move on within ~3–5 minutes.",
    },
    failureModes: [
      "**Unit slips:** MB vs Mb, per day vs per second. Write units on every line.",
      "**Sizing for the average:** systems fail at peak — apply a peak factor.",
      "**Forgetting replication, indexes and backups:** real storage is often 3× (or more) the raw data.",
      "**Numbers that lead nowhere:** an estimate only matters if you say what it implies for the design.",
    ],
    explain: {
      prompt: "Explain how you'd estimate the storage needed for a chat app with 50M daily users over 5 years.",
      keyPoints: [
        "State assumptions: messages per user per day and bytes per message",
        "Messages/day = users × messages per user",
        "Storage/day = messages/day × size, then × 365 × years",
        "Round to powers of ten and keep units on every line",
        "Mention replication and what the number implies (e.g. partitioning)",
      ],
    },
    interviewAnswer:
      "I'll make a few assumptions and round aggressively. Say 50M daily users send 40 messages a day: that's 2 billion messages a day, roughly 20 thousand per second on average and maybe 50 thousand at peak. At about 200 bytes per message, that's 400 GB a day — around 150 TB a year before replication, or roughly 450 TB with three replicas. That tells me the write rate and data volume are beyond a single database node, so I'd partition messages by conversation, and I'd consider moving older messages to cheaper storage.",
    mistakes: [
      {
        weak: "Skipping estimation, then adding sharding \"to be safe\".",
        why: "Sharding has real costs — cross-shard queries, rebalancing, operational load — and without numbers you can't explain why you need it.",
        strong: "\"About 2 TB over 5 years fits on one primary with replicas — sharding isn't needed yet.\"",
      },
      {
        weak: "Computing 86,400 × 365 precisely and losing two minutes.",
        why: "The extra precision never changes the decision, and the time is better spent on the design.",
        strong: "\"A day is about 10⁵ seconds, so 2 billion messages a day is roughly 20k per second.\"",
      },
    ],
    questions: [
      { q: "How many seconds are in a day, for estimation purposes?", short: "86,400 — round to 10⁵ to make division easy." },
      { q: "Why size for peak rather than average?", short: "Traffic is bursty (daily cycles, events, launches). A system sized for the average fails exactly when most users are active; a 2–3× peak factor is a common starting assumption." },
      { q: "How does replication affect storage estimates?", short: "Multiply by the replication factor (often 3) and add headroom; indexes and backups add more on top." },
    ],
    recap: ["DAU × actions ÷ 10⁵ = average QPS; peak ≈ 2–3×.", "Storage = items/day × size × retention × replicas.", "Every estimate should end with \"so the design needs…\"."],
    recall: {
      prompt: "50M daily users each upload 2 photos of ~500 KB. Roughly how much new storage per day?",
      options: [
        { text: "~5 GB", verdict: "weak", why: "Off by 10,000×: 50M × 2 × 500 KB = 50 TB." },
        { text: "~50 TB", verdict: "best", why: "10⁸ photos × 5×10⁵ bytes = 5×10¹³ bytes ≈ 50 TB/day — object storage + CDN, not a database." },
        { text: "~500 TB", verdict: "weak", why: "10× too high; recheck the multiplication." },
      ],
    },
    prerequisites: ["interview-framework"],
    deeper: [
      { label: "Walkthrough: file storage service", href: "/learn/designs/file-storage", kind: "design" },
      { label: "Walkthrough: chat application", href: "/learn/designs/chat-app", kind: "design" },
    ],
  },

  {
    slug: "api-data-modeling",
    title: "APIs and data modeling",
    shortTitle: "APIs & data models",
    stage: 11,
    minutes: 12,
    summary: "Define the handful of endpoints and entities that anchor the rest of your design — and choose keys from the queries you'll run.",
    outcome: "Define the few APIs and entities that matter, choose keys from access patterns, and make unsafe operations idempotent.",
    problem:
      "Architecture discussions drift when nobody has agreed what the system's interface is or what data it stores. Worse, a schema designed without its queries can't be evaluated: keys and indexes only make sense relative to how data is read.",
    simple: "List the few API calls users make and the core tables or collections they touch, then name the queries each one runs. 3–5 endpoints is usually plenty.",
    howItWorks: [
      "**Endpoints:** verb + resource + key parameters, e.g. `POST /urls {long_url}` → `{short_code}`, `GET /{code}` → redirect.",
      "**HTTP semantics:** `GET` is safe (no side effects) and cacheable; `PUT` and `DELETE` are idempotent; `POST` is neither by default — so creates need explicit idempotency.",
      "**Idempotency keys:** for create/payment endpoints, the client sends a unique key per logical operation; the server stores it with the result, so a retry returns the original result instead of creating a duplicate.",
      "**Pagination:** cursor-based (`?cursor=…&limit=20`) stays fast for deep pages and doesn't skip or repeat items when new data arrives; offsets scan and discard rows.",
      "**Entities and access patterns:** for each entity, name the primary key and the queries that hit it. The access pattern drives the key, the indexes and often the choice of database.",
    ],
    example: {
      title: "A URL shortener's API and data model",
      setup: "Two operations dominate: create a short link, and redirect from it.",
      steps: [
        "`POST /urls {long_url, custom_alias?}` → `201 {short_code}`. It creates data, so it accepts an `Idempotency-Key` header: a retried request gets the same code, not a second link.",
        "`GET /{short_code}` → `301`/`302` with `Location: long_url`. Safe and cacheable.",
        "Entity: `links(short_code PRIMARY KEY, long_url, owner_id, created_at, expires_at)`.",
        "Hot access pattern: \"look up by short_code\" — a point lookup on the primary key. That's why a key-value store or a simple indexed table both work, and why redirects are easy to cache.",
        "Secondary pattern: \"list my links, newest first\" → an index on `(owner_id, created_at)` — added only because we named the query.",
      ],
      takeaway: "Naming the queries first told us the key, the index and what can be cached.",
    },
    whenToUse: ["Step 3 of every design.", "Whenever a deep dive depends on how data is queried or partitioned."],
    whenNotToUse: ["Don't write full schemas with every column — focus on keys, relationships and access patterns."],
    tradeoffs: {
      pros: ["Forces clarity on access patterns", "Makes database, index and caching choices defensible"],
      cons: ["Too much detail eats interview time"],
      decide: "Model only what a deep dive will need, and always pair a table with the queries that use it.",
    },
    failureModes: [
      "**Retries without idempotency:** the server commits, the response is lost, the client retries — and creates a duplicate order or charge.",
      "**Offset pagination on a hot table:** `OFFSET 100000` scans and discards rows, and pages shift as new items arrive.",
      "**Chatty APIs:** a screen that needs 30 calls multiplies latency on mobile networks — batch or add an aggregate endpoint.",
      "**Unbounded responses:** a list without a limit can return megabytes — always paginate.",
    ],
    explain: {
      prompt: "Explain how you'd design the API for submitting an order so a client retry after a timeout never creates two orders.",
      keyPoints: [
        "The client generates an idempotency key per logical operation",
        "The server stores the key with the result, atomically with creating the order",
        "A repeated key returns the stored result instead of creating a new order",
        "Keys expire after a retention window",
        "Contrast with methods that are already safe/idempotent (GET, PUT)",
      ],
    },
    interviewAnswer:
      "I'll keep the API small and driven by the core use cases. For a URL shortener that's POST /urls to create a link and GET /{code} to redirect. Creates aren't idempotent, so they accept an idempotency key — if the client retries after a timeout, it gets the same result rather than a duplicate. For the data model I start from access patterns: the hot path is lookup by short code, so short_code is the primary key, and 'list my links' gets an index on owner and creation time. Lists use cursor pagination so deep pages stay fast and stable.",
    mistakes: [
      {
        weak: "Designing tables without saying how they're queried.",
        why: "Keys and indexes only make sense relative to queries; without them nobody can evaluate the schema.",
        strong: "\"We fetch a user's timeline by user_id ordered by time, so the key is (user_id, created_at).\"",
      },
      {
        weak: "`GET /createOrder?item=42`",
        why: "GET must be safe: crawlers, link prefetchers and caches may repeat it and create orders by accident.",
        strong: "`POST /orders` with an `Idempotency-Key` header; GET only reads.",
      },
    ],
    questions: [
      { q: "Why prefer cursor pagination for a feed?", short: "It stays fast with deep pages and doesn't skip or duplicate items when new posts arrive." },
      { q: "REST or gRPC for public APIs?", short: "REST/JSON for public, browser-facing APIs; gRPC is common between internal services for performance and typed contracts." },
      { q: "How would you version an API?", short: "Make additive, backward-compatible changes where possible; for breaking changes use a versioned path or header (e.g. /v2) and run both versions while clients migrate." },
    ],
    recap: ["3–5 endpoints, core entities, named access patterns.", "Cursor pagination for lists.", "Idempotency keys for unsafe operations."],
    recall: {
      prompt: "A client retries `POST /payments` after a timeout. How do you avoid charging twice?",
      options: [
        { text: "Tell clients never to retry", verdict: "weak", why: "Networks fail; retries are necessary." },
        { text: "Require an idempotency key and store results keyed by it", verdict: "best", why: "A repeated key returns the original result instead of charging again." },
        { text: "Use GET instead of POST", verdict: "weak", why: "GET must be safe; it doesn't solve duplicate side effects." },
      ],
    },
    prerequisites: ["http-request-flow"],
    deeper: [
      { label: "Reliability: retries & idempotency", href: "/learn/concepts/reliability-patterns", kind: "brief" },
      { label: "Databases: SQL vs NoSQL & indexes", href: "/learn/concepts/databases", kind: "brief" },
      { label: "Walkthrough: URL shortener", href: "/learn/designs/url-shortener", kind: "design" },
    ],
  },

  {
    slug: "http-request-flow",
    title: "HTTP, APIs and the backend request flow",
    shortTitle: "Request flow",
    stage: 1,
    minutes: 12,
    summary: "What actually happens between typing a URL and seeing a page — the path every design builds on, and where the time goes.",
    outcome: "Walk a request from browser to database and back, naming what each hop adds: latency, failure points and scaling options.",
    problem:
      "Every system design diagram is a variation of one request travelling from a client to data and back. If that path is fuzzy, you can't reason about where latency comes from, what fails, or which component to scale.",
    simple: "The browser finds the server's address (DNS), opens a secure connection (TCP + TLS), sends an HTTP request, and a server runs code, reads data and sends back a response.",
    analogy: "Looking up a restaurant's address (DNS), calling ahead to confirm who you're talking to (TCP/TLS handshake), placing an order (request) and receiving the dish (response).",
    howItWorks: [
      "**DNS** maps a name to an IP address; answers are cached by the browser, the OS and resolvers for the record's TTL.",
      "**TCP + TLS** establish a reliable, encrypted connection. Each handshake costs round trips before any data flows; reusing connections (keep-alive, HTTP/2) avoids paying that again.",
      "**HTTP request:** method (GET/POST/PUT/DELETE), path, headers, optional body. **Response:** status code (2xx success, 3xx redirect, 4xx client error, 5xx server error), headers, body (often JSON).",
      "**Server side:** a load balancer (spreads requests across several servers) → a stateless app server (authentication, validation, business logic; it keeps no per-user data in memory between requests, so any server can handle any request) → a cache or database.",
      "**Latency** is how long one request takes; **throughput** is how many complete per second; **bandwidth** is how much data per second a link can carry.",
    ],
    sceneId: "request-flow",
    example: {
      title: "Where do the milliseconds go?",
      setup: "A user ~200 ms round-trip time (RTT) away from your only region opens a product page. Server work takes 50 ms (5 ms of logic + 45 ms of database queries).",
      steps: [
        "**Cold connection:** TCP handshake (1 RTT) + TLS 1.3 handshake (1 RTT) + request/response (1 RTT) ≈ **600 ms** of network time.",
        "**Add server time:** ≈ **650 ms** in total. Most of it is distance, not your code.",
        "**Warm connection** (reused via keep-alive or HTTP/2): only the request/response RTT — ≈ **250 ms**.",
        "**Fixes, roughly in order of impact:** reuse connections; serve static and cacheable content from a CDN edge near the user (TLS terminates nearby); cache the 45 ms of database reads; consider a closer region for dynamic APIs.",
      ],
      takeaway: "Before optimising code, find where the time goes — round trips and database calls usually dominate.",
    },
    whenToUse: ["Walking through \"what happens when a user does X\" in any design.", "Explaining where latency comes from before proposing caches or CDNs."],
    whenNotToUse: ["Don't recite TCP packet details in a design interview unless asked — focus on hops, latency and failure points."],
    tradeoffs: {
      pros: ["A shared mental model of every component's role"],
      cons: ["Each extra hop (gateway, service, cache) adds latency and another failure point"],
      decide: "Add a hop only when it buys something you can name — caching, isolation, security, or independent scaling.",
    },
    failureModes: [
      "**A slow dependency** (a 2 s query) ties up app-server threads and connections; the backlog slows healthy requests too.",
      "**No timeouts** on outbound calls: requests hang and pile up until the server runs out of resources.",
      "**DNS TTLs and caching** slow failover: clients keep using an old IP until records expire.",
      "**Long chains of synchronous calls**: latency adds up, and any one failure fails the request.",
    ],
    explain: {
      prompt: "Explain what happens, end to end, when a user loads their profile page — and where you'd look first if it were slow.",
      keyPoints: [
        "DNS resolves the domain to the load balancer's address",
        "TCP/TLS connection setup costs round trips (and can be reused)",
        "The load balancer picks a healthy, stateless app server",
        "The app server authenticates, runs logic, reads from cache or database",
        "Measure where time goes: network round trips, database, or app code",
      ],
    },
    interviewAnswer:
      "The browser resolves the domain through DNS — usually from a cache — to our load balancer's address. It opens a TCP connection and a TLS session; on a cold connection that's a couple of round trips before the request is even sent, which is why connection reuse and CDNs matter for distant users. The HTTPS request reaches the load balancer, which forwards it to one of several stateless app servers. The server authenticates the request, runs the business logic and reads data — from a cache if it can, otherwise the database — and returns a response with a status code, typically JSON. If it were slow, I'd first measure where the time goes: network round trips, waiting on the database, or the app itself.",
    mistakes: [
      {
        weak: "\"The request goes to the server and then the database.\"",
        why: "It skips every component that matters for scaling and failure — DNS, the load balancer, statelessness, caching — so there's nothing to discuss.",
        strong: "\"DNS resolves to the load balancer, which forwards to one of N stateless app servers; they read from a cache, falling back to the primary database.\"",
      },
      {
        weak: "\"The page is slow, let's add more servers.\"",
        why: "More servers only help if they're the bottleneck. If time is spent waiting on the database or the network, adding servers changes nothing.",
        strong: "\"p95 is 800 ms but app CPU is 10%, so the time is in database calls — I'd check query plans and caching first.\"",
      },
    ],
    questions: [
      { q: "What's the difference between 401 and 403?", short: "401: not authenticated (who are you?). 403: authenticated, but not allowed to do this." },
      { q: "Why keep app servers stateless?", short: "Any server can handle any request, so you can add or remove servers behind a load balancer freely. Session state goes to a shared store or a signed token." },
      { q: "What's the difference between latency and throughput?", short: "Latency is how long one request takes; throughput is how many complete per second. Adding servers raises throughput without reducing latency, and a queue can raise throughput while increasing latency." },
    ],
    recap: ["DNS → TCP/TLS → HTTP → load balancer → app → data → response.", "Round trips and data access dominate latency.", "Stateless servers scale horizontally."],
    recall: {
      prompt: "Users complain pages are slow, but your app server CPU is at 10%. Where would you look first?",
      options: [
        { text: "Add more app servers", verdict: "weak", why: "Low CPU means the servers aren't the bottleneck." },
        { text: "Database query latency and missing indexes", verdict: "best", why: "Servers waiting on slow queries look idle — check database time per request." },
        { text: "Network latency between client and server (e.g. a far-away region)", verdict: "valid", why: "Also plausible — a CDN or a closer region helps static content and round trips." },
      ],
    },
    prerequisites: [],
    deeper: [
      { label: "Load balancing & horizontal scaling", href: "/learn/concepts/load-balancing", kind: "brief" },
      { label: "Caching & Redis", href: "/learn/concepts/caching", kind: "brief" },
      { label: "CDN & object storage", href: "/learn/concepts/cdn-object-storage", kind: "brief" },
    ],
  },

  {
    slug: "databases",
    title: "SQL vs NoSQL and database indexes",
    shortTitle: "Databases & indexes",
    stage: 3,
    minutes: 14,
    summary: "How to choose a database from access patterns and consistency needs, and why indexes make reads fast and writes slower.",
    outcome: "Choose a database from access patterns and consistency needs, and design indexes that make the hot queries fast.",
    problem:
      "The database is usually the hardest component to scale and the most expensive to change later. Picking one by popularity — or a blanket \"NoSQL scales\" — instead of by access pattern and consistency needs leads to painful migrations.",
    simple:
      "Relational (SQL) databases store rows in tables with relationships and strong transactional guarantees. NoSQL databases trade some of that for flexible data models or easier horizontal scaling. Indexes are lookup structures that let the database find rows without scanning everything.",
    analogy: "An index is the index at the back of a textbook: you find \"caching\" on page 212 without reading every page — but every new edition has to update it.",
    howItWorks: [
      "**SQL (PostgreSQL, MySQL):** schemas, joins and ACID transactions. A strong default for business data. Scales reads with replicas; very high write volumes eventually need sharding.",
      "**NoSQL families:** key-value (Redis, DynamoDB) for lookups by key; document (MongoDB) for nested, flexible records; wide-column (Cassandra) for very high write volumes partitioned by key; graph databases for relationship traversal.",
      "**Indexes (usually B-trees):** turn a full table scan into a logarithmic lookup. A composite index on `(a, b)` serves queries on `a`, or on `a` and `b` — but not on `b` alone (leftmost-prefix rule).",
      "**Cost of indexes:** every index must be updated on each write and uses storage. Index what you filter, join and sort by — not everything.",
      "**Transactions (ACID):** atomic, consistent, isolated, durable — essential when several rows must change together, like an order and its stock decrement.",
      "**Normalise vs denormalise:** normalised data avoids duplication; denormalised data (stored in the shape of the query) reads faster but must be kept in sync.",
    ],
    example: {
      title: "Choosing storage for an e-commerce app",
      setup: "The app has orders, payments and inventory; a product catalogue; and a \"recently viewed\" list per user.",
      steps: [
        "**Orders, payments, inventory:** creating an order and decrementing stock must succeed or fail together → a relational database with transactions.",
        "**Hot query** \"my orders, newest first\" → a composite index on `(user_id, created_at)`, so the database reads only the 20 rows it returns.",
        "**Product catalogue:** read-heavy, attributes vary by category → relational with JSON columns or a document store; either way, cache popular products.",
        "**Recently viewed:** a per-user list, overwritten constantly, harmless to lose → a key-value store such as Redis with a TTL.",
        "**Result:** different stores for different data sets, chosen by access pattern — not one \"SQL vs NoSQL\" decision for the whole system.",
      ],
      takeaway: "Decide per data set: what queries hit it, what consistency it needs, and how it grows.",
    },
    whenToUse: ["SQL: relational data, multi-row transactions, ad-hoc queries — and when unsure.", "NoSQL: very high write throughput, simple key-based access, flexible schema, or data that partitions cleanly by one key."],
    whenNotToUse: ["Don't pick NoSQL just for \"scale\" when your data is relational and fits comfortably in SQL.", "Don't index every column."],
    tradeoffs: {
      pros: ["SQL: transactions, joins, mature tooling", "NoSQL: horizontal scale, flexible schemas, predictable key lookups"],
      cons: ["SQL: write scaling eventually needs sharding", "NoSQL: weaker joins and transactions; data is modelled per query"],
      decide: "Start from the access pattern and consistency need; justify a NoSQL store with a specific requirement.",
    },
    failureModes: [
      "**Missing index on a growing table:** a query that took 5 ms at 10k rows takes seconds at 50M rows (full scans).",
      "**Too many indexes on a write-heavy table:** every insert updates every index and write throughput drops.",
      "**Lock contention:** many transactions updating the same row (a global counter, a hot product's stock) serialise and time out.",
      "**Connection exhaustion:** many app servers × large pools exceed the database's connection limit — use pooling.",
      "**Analytics on the primary:** long-running reports starve transactional traffic — run them on a replica or a warehouse.",
    ],
    explain: {
      prompt: "Explain how you'd choose storage for user sessions and for orders in the same application.",
      keyPoints: [
        "Start from access patterns: sessions are fetched by ID; orders are queried, filtered and joined",
        "Orders need transactions together with payments and stock",
        "Sessions need low latency and can expire → key-value store with TTL",
        "Indexes matched to the hot order queries",
        "No blanket \"NoSQL scales better\" claim",
      ],
    },
    interviewAnswer:
      "I choose per data set, based on access patterns and consistency needs. Orders, payments and inventory need transactions — creating an order and decrementing stock must succeed or fail together — so they go in a relational database, with indexes matched to the hot queries, like (user_id, created_at) for 'my recent orders'. Sessions are only ever looked up by ID, need to be fast and can expire, so a key-value store like Redis with a TTL fits better. I'd reach for a wide-column store like Cassandra only if I had a very high write volume with queries known up front, like messages partitioned by conversation.",
    mistakes: [
      {
        weak: "\"NoSQL because it scales better.\"",
        why: "\"Scales better\" isn't a requirement. It ignores the access pattern and gives up joins and transactions the data may need.",
        strong: "\"Messages are written at 100k/s and always read by conversation, so a wide-column store partitioned by conversation_id fits.\"",
      },
      {
        weak: "\"I'll index every column to be safe.\"",
        why: "Each index costs storage and slows every write; unused indexes are pure overhead.",
        strong: "\"The hot query filters by user and sorts by time, so one composite index on (user_id, created_at) covers it.\"",
      },
    ],
    questions: [
      { q: "Why might a query be slow even with an index?", short: "The index doesn't match the filter or sort order (leftmost-prefix rule), the filter isn't selective, or a function on the column prevents the index being used." },
      { q: "When would you choose Cassandra?", short: "Very high write throughput with queries known up front and partitioned by key (e.g. messages by conversation_id), accepting tunable consistency and query-driven modelling." },
      { q: "What does transaction isolation protect against?", short: "Concurrent transactions interfering — e.g. two checkouts both read stock = 1 and both sell it. Higher isolation levels or row locks (SELECT … FOR UPDATE) prevent such anomalies at some cost to concurrency." },
    ],
    recap: ["Choose by access pattern and consistency needs, per data set.", "Indexes speed reads and slow writes; match them to hot queries.", "SQL is a strong default; justify NoSQL specifically."],
    recall: {
      prompt: "A `SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` is slow on 50M rows. Best first fix?",
      options: [
        { text: "Move to NoSQL", verdict: "weak", why: "A big migration for something an index fixes." },
        { text: "Add a composite index on (user_id, created_at)", verdict: "best", why: "It matches both the filter and the sort, so the database reads just 20 index entries." },
        { text: "Cache the results", verdict: "valid", why: "Can help hot users, but fix the query first — caches hide slow queries rather than cure them." },
      ],
    },
    prerequisites: ["http-request-flow"],
    deeper: [
      { label: "Replication & sharding", href: "/learn/concepts/replication-sharding", kind: "brief" },
      { label: "Caching & Redis", href: "/learn/concepts/caching", kind: "brief" },
      { label: "Walkthrough: chat application", href: "/learn/designs/chat-app", kind: "design" },
    ],
  },

  {
    slug: "caching",
    title: "Caching and Redis",
    shortTitle: "Caching",
    stage: 4,
    minutes: 14,
    summary: "Serve repeated reads from memory — and handle the hard parts: invalidation, stampedes, and what happens when the cache is empty or down.",
    outcome: "Decide when a cache helps, choose a strategy and TTL, and explain invalidation, stampedes and cache-failure behaviour.",
    problem:
      "Suppose thousands of users request the same popular product every second. If every request reaches the database, it performs the same work over and over — burning capacity and adding latency for data that hardly changes.",
    simple: "Keep a temporary copy of frequently read data in fast memory (like Redis), close to the application. Check the copy first and only go to the database when it's missing — then decide how the copy stays correct.",
    analogy: "Keeping your most-used tools on the desk instead of walking to the garage each time — but if someone swaps a tool in the garage, your desk copy is out of date until you notice.",
    howItWorks: [
      "**Cache-aside (lazy loading):** read the cache → on a miss, read the database and store the result with a TTL. On a write, update the database and delete the cache key. The most common pattern.",
      "**Write-through:** write to the cache and database together — reads are always fresh, writes are slower. **Write-back:** write to the cache and flush to the database later — fast writes, but data can be lost if the cache fails.",
      "**TTL and eviction:** a TTL bounds how stale data can get; when memory fills up, an eviction policy such as LRU drops the least recently used keys.",
      "**Hit ratio** is the number that matters: it sets how much load reaches the database. Caching data that's rarely re-read just burns memory.",
      "**Cache stampede (thundering herd):** when a hot key expires, many requests miss at once and all rebuild it. Use a lock or single-flight so one request recomputes, refresh early, or jitter TTLs.",
      "**Delete/fill race:** a slow reader can write an old value back right after a writer deleted the key. Short TTLs or versioned keys bound the damage.",
    ],
    sceneId: "cache-aside",
    example: {
      title: "Caching product pages",
      setup: "20,000 product reads/s. The database comfortably serves ~4,000 queries/s at ~10 ms each; a cache read takes ~1 ms. Prices change a few times a day.",
      steps: [
        "**No cache:** 20,000 reads/s hit a database sized for 4,000 — it saturates and latency explodes.",
        "**Cache-aside, 90% hit ratio:** 10% miss → **2,000** database reads/s (50% of capacity). Average latency ≈ 0.9 × 1 ms + 0.1 × (1 + 10) ms ≈ **2 ms**.",
        "**80% hit ratio:** 4,000 database reads/s — exactly at capacity. The hit ratio is a capacity-planning number, not just a speed number.",
        "**Freshness:** 5-minute TTL + delete-on-write. Price changes show up on the next read; the TTL caps staleness if an invalidation is ever missed.",
        "**Cache failure:** the hit ratio drops to 0% and all 20,000 reads/s land on the database at once. Protect it with cache replicas, request coalescing and a fallback rate limit.",
      ],
      takeaway: "A cache changes how much load the database must handle — so you must also plan for the moment it's empty or down.",
    },
    lab: "cache",
    whenToUse: ["Read-heavy workloads with hot keys (profiles, product pages, timelines).", "Expensive computations whose results can be reused."],
    whenNotToUse: ["Data that must be perfectly fresh at the moment of use (account balances when charging).", "Write-heavy data with low re-read rates."],
    tradeoffs: {
      pros: ["Lower latency (~1 ms vs ~10 ms+ in this example)", "Offloads the database, often by an order of magnitude"],
      cons: ["Stale data", "Invalidation complexity", "Memory cost", "Another component that can fail"],
      decide: "Cache when reads ≫ writes and brief staleness is acceptable; state the hit-ratio assumption, the TTL and the invalidation strategy.",
    },
    failureModes: [
      "**Cold start or flush:** hit ratio 0% → full traffic hits the database. Warm critical keys or ramp traffic up gradually.",
      "**Stampede on a hot key's expiry:** many concurrent misses rebuild the same value. Single-flight locks, early refresh or jittered TTLs.",
      "**Stale reads:** a missed invalidation or a delete/fill race serves old data until the TTL expires.",
      "**Hot key overload:** one key (a celebrity profile) can saturate a single cache node — replicate it or add a small in-process cache.",
      "**Memory pressure:** eviction drops useful keys, the hit ratio falls and database load rises.",
    ],
    explain: {
      prompt: "Explain why you'd put a cache in front of the product database, how you'd keep it fresh, and what happens if the cache goes down.",
      keyPoints: [
        "Justify with the read/write ratio and an assumed hit ratio",
        "Cache-aside: read cache; on a miss read the database and fill with a TTL",
        "Delete the key on write; the TTL is a safety net for staleness",
        "A cache failure sends all traffic to the database — plan for it",
        "Stampede protection for hot keys",
      ],
    },
    interviewAnswer:
      "Product pages are read thousands of times for every update, so I'd use cache-aside with Redis: read from the cache, and on a miss read the database and store the result with a TTL — say five minutes. When a price changes, the write path updates the database and deletes the key, so the next read refills it; the TTL caps staleness if an invalidation is ever missed. With a 90% hit ratio the database sees a tenth of the read traffic. The risk is the cache failing or a hot key expiring: then the database takes the full load at once, so I'd run Redis with replicas, coalesce requests for hot keys, and make sure the database can survive a degraded period.",
    mistakes: [
      {
        weak: "\"Add Redis to make it fast.\"",
        why: "It doesn't say what to cache, why it would hit, or how the data stays correct — \"fast\" isn't a design.",
        strong: "\"Product pages are read 1,000× more than they're updated, so cache-aside with a 5-minute TTL, invalidated on price change.\"",
      },
      {
        weak: "Ignoring invalidation entirely.",
        why: "Every cache is a second copy of the data. Without an invalidation strategy, users see wrong prices or stale permissions.",
        strong: "Name the strategy: TTL, delete-on-write, or versioned keys — and the staleness you accept.",
      },
      {
        weak: "\"We'll cache everything with a 24-hour TTL.\"",
        why: "Long TTLs without invalidation serve stale data for hours, and caching rarely read data evicts the hot keys that matter.",
        strong: "\"Hot product pages with a 5-minute TTL and delete-on-write; per-user data stays uncached unless profiling shows it matters.\"",
      },
    ],
    questions: [
      { q: "How do you keep the cache and database consistent?", short: "Cache-aside with delete-on-write plus a TTL as a safety net; accept brief staleness, or use write-through where freshness matters more than write latency." },
      { q: "What happens if Redis goes down?", short: "Requests fall back to the database, which may be overloaded. Run cache replicas, size the database for a degraded period, and rate-limit or shed load on the fallback path." },
      { q: "What's a cache stampede and how do you prevent it?", short: "When a hot key expires, many concurrent requests miss and all hit the database to rebuild it. Prevent it with a lock/single-flight so one request recomputes, early refresh before expiry, or jittered TTLs." },
    ],
    recap: ["Cache-aside is the default pattern.", "TTL bounds staleness; delete on write.", "The hit ratio sets database load — plan for 0%."],
    recall: {
      prompt: "Your database is receiving too many repeated reads for the same product pages. What would you consider first?",
      options: [
        { text: "A cache (cache-aside with TTL) in front of the database", verdict: "best", why: "Repeated identical reads are exactly what caching serves best." },
        { text: "Read replicas", verdict: "valid", why: "Also spreads reads, but each read still does database work; better when reads are varied rather than repeated." },
        { text: "Shard the database", verdict: "weak", why: "Sharding addresses data size and write scale, not repeated reads." },
        { text: "A CDN for the page HTML and assets", verdict: "valid", why: "Great for public, cacheable responses and static assets." },
      ],
    },
    prerequisites: ["databases"],
    deeper: [
      { label: "CDN & object storage", href: "/learn/concepts/cdn-object-storage", kind: "brief" },
      { label: "Walkthrough: news feed", href: "/learn/designs/news-feed", kind: "design" },
      { label: "Walkthrough: URL shortener", href: "/learn/designs/url-shortener", kind: "design" },
    ],
  },
];
