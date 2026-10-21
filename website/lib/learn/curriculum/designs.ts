import type { DesignWalkthrough } from "./types";

/**
 * End-to-end design walkthroughs. Each follows the 7-step interview workflow;
 * the learner answers each "Your turn" prompt before revealing a model answer,
 * then reads coaching on what made it strong and how an interviewer might push back.
 * All numbers are derived from stated assumptions and rounded to powers of ten.
 */
export const DESIGNS: DesignWalkthrough[] = [
  {
    slug: "url-shortener",
    title: "Design a URL shortener",
    level: "Beginner",
    minutes: 30,
    summary: "The classic warm-up: collision-free ID generation, a read-heavy redirect path, caching and the 301 vs 302 trade-off.",
    outcome: "Design a read-heavy service end to end: ID generation, redirect caching and the 301 vs 302 trade-off.",
    simulatorProblem: "URL Shortener",
    concepts: ["estimation", "api-data-modeling", "databases", "caching", "load-balancing"],
    steps: [
      {
        id: "requirements",
        prompt: "List the core features, the questions you'd ask, and 2–3 non-functional requirements.",
        answer: [
          "**Clarifying questions:** custom aliases? Link expiry? Click analytics? Can anyone create links, or only signed-in users?",
          "**Functional:** create a short link for a long URL; redirect a short link to the original; optional custom alias and expiry.",
          "**Non-functional:** redirects are fast (< 50 ms server time) and highly available; short codes never collide; analytics can be eventually consistent.",
        ],
        coach: {
          strong: "It separates must-haves from options and turns \"fast and reliable\" into a concrete target the rest of the design can be checked against.",
          challenge: "\"Do we need analytics?\" — Say it changes the redirect type (302 vs 301) and adds an async event pipeline, then ask whether it's in scope.",
        },
      },
      {
        id: "scale",
        prompt: "Assume 100M new links/month and a 100:1 read/write ratio. Estimate writes/s, reads/s, 5-year storage and the code length you need.",
        answer: [
          "**Writes:** 100M ÷ (30 days × ~10⁵ s) ≈ **~40/s**.",
          "**Reads:** × 100 ≈ **~4,000/s** average, ~10,000/s at peak.",
          "**Storage:** 100M × 12 × 5 = 6B links × ~500 bytes ≈ **3 TB** — one well-provisioned database can hold it.",
          "**Code length:** 62⁶ ≈ 57 billion and 62⁷ ≈ 3.5 trillion, so 7 Base62 characters leave plenty of room for 6B links.",
          "**So:** very read-heavy with modest data → optimise the redirect path with caching; writes are easy.",
        ],
        coach: {
          strong: "Every number leads to a decision: the read/write ratio justifies caching, the storage total rules out early sharding, and the code length follows from the link count.",
          challenge: "\"What if traffic is 100× higher?\" — ~1M reads/s: still mostly cache hits, but the cache tier must be sharded and popular redirects served from the edge.",
        },
      },
      {
        id: "api",
        prompt: "Define the endpoints and the main table, and name the hot query.",
        answer: [
          "`POST /urls {long_url, custom_alias?, expires_at?}` with an `Idempotency-Key` header → `{short_code}`; `GET /{short_code}` → `301`/`302` redirect.",
          "Table `links(short_code PRIMARY KEY, long_url, owner_id, created_at, expires_at)`. The hot query is lookup by `short_code` — a key-value access pattern.",
        ],
        coach: {
          strong: "The model is justified by the single hot access pattern — lookup by short_code — which is what keeps the rest of the design simple.",
          challenge: "\"Why not key by the long URL?\" — Redirects look up by code, and long URLs are variable-length; you'd still need an index on short_code.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch the request path for a redirect, and where analytics would go.",
        answer: [
          "Client → load balancer → stateless app servers → Redis cache → database.",
          "**Redirect:** check the cache by short_code → on a miss, read the database and fill the cache → return the redirect. Creation writes to the database (and can warm the cache).",
          "**Analytics (if in scope):** the redirect publishes a click event to a queue; a separate consumer aggregates counts, off the hot path.",
        ],
        coach: {
          strong: "It walks one request end to end and keeps the hot path (redirects) separate from slower concerns like analytics.",
          challenge: "\"Why a cache if the database is fast?\" — ~10k reads/s concentrated on hot keys: the cache keeps latency low and shields the database during viral spikes.",
        },
      },
      {
        id: "deep-dive",
        prompt: "How do you generate short codes that never collide? Compare at least two approaches.",
        answer: [
          "**Base62 of a unique ID:** a counter service hands out ranges of IDs (say 1,000 at a time) to each app server — no per-request coordination and no collisions. Codes are sequential and therefore guessable; encode a shuffled ID if that matters.",
          "**Hash the URL** (first 7 characters of a hash): the same URL always maps to the same code, but different URLs can collide — check on insert and re-hash with a salt.",
          "**Random codes:** unguessable, but every insert needs a uniqueness check (a unique constraint plus a retry).",
        ],
        coach: {
          strong: "It compares approaches on the properties that matter — collisions, coordination, guessability — instead of declaring one correct.",
          challenge: "\"What if the counter service goes down?\" — Each server holds a pre-fetched range, so it keeps issuing codes for a while; run the counter replicated, or generate IDs Snowflake-style from a timestamp and machine ID.",
        },
      },
      {
        id: "failures",
        prompt: "What breaks first at 10× traffic, and what happens if the cache fails?",
        answer: [
          "**Hot links** (a viral post) concentrate reads on a few keys: the cache absorbs them; an edge cache or CDN can serve popular redirects even closer to users.",
          "**Cache failure:** reads fall back to the database — keep read replicas and headroom to survive, and coalesce requests for hot keys.",
          "**Abuse:** rate-limit link creation per user or IP, and scan destinations for malware and phishing.",
        ],
        coach: {
          strong: "It names concrete failure scenarios with a mitigation for each — including abuse, which interviewers like to probe.",
          challenge: "\"The database fails over and loses a few seconds of writes — then what?\" — Recently created links may 404. With async replication you accept that small risk, or use synchronous replication for the link table.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "301 or 302 redirects — which, and why? And SQL or a key-value store?",
        answer: [
          "**301 (permanent)** lets browsers cache the redirect: less load, but you lose per-click analytics and can't easily change the destination. **302 (temporary)** sends every click to you: accurate analytics and editable links, at the cost of more load.",
          "**SQL vs key-value:** both fit ~3 TB. A key-value store matches the single access pattern; SQL keeps things simple and supports \"list my links\" and admin queries. Choose by the secondary features you need.",
        ],
        coach: {
          strong: "Each choice is tied to a requirement — analytics, editability — rather than presented as universally right.",
          challenge: "\"You chose 302 — isn't that more load?\" — Yes; if analytics matter more than server cost it's worth it, and the cache keeps the extra load cheap.",
        },
      },
    ],
    followUps: [
      { q: "How would you add click analytics without slowing redirects?", short: "Publish a click event to a queue or log on redirect and aggregate asynchronously." },
      { q: "How do you handle expired links?", short: "Check expires_at on read and return 404/410; clean up expired rows with a background job." },
      { q: "How would you prevent short links to malicious sites?", short: "Check destinations against threat lists at creation, re-scan periodically, and show an interstitial warning for flagged links." },
    ],
    wrapUp: [
      "Writes: collision-free 7-character Base62 codes from pre-allocated ID ranges (~40 writes/s).",
      "Reads: ~10k redirects/s at peak through stateless servers and a Redis cache, with the database as the source of truth.",
      "302 if analytics matter (301 if load matters more); click events aggregated asynchronously.",
      "Failure plan: database headroom and replicas for cache loss, rate limits and URL scanning against abuse.",
    ],
  },

  {
    slug: "rate-limiter",
    title: "Design a rate limiter",
    level: "Beginner",
    minutes: 25,
    summary: "Limit requests per client across many servers with low latency — and decide what happens when the limiter itself fails.",
    outcome: "Design a distributed rate limiter, compare limiting algorithms and choose fail-open or fail-closed behaviour.",
    simulatorProblem: "API Rate Limiter",
    concepts: ["reliability-patterns", "caching", "load-balancing"],
    steps: [
      {
        id: "requirements",
        prompt: "Who is limited, by what key, and what happens when they exceed the limit?",
        answer: [
          "**Clarifying questions:** per user, per API key or per IP? One global limit or per endpoint? Is the limit shared across many servers?",
          "Limit by user ID or API key (IP only for anonymous traffic), e.g. 100 requests per minute per key, with different tiers.",
          "Exceeding returns **HTTP 429** with a `Retry-After` header. The limiter must add minimal latency and must not become a single point of failure.",
        ],
        coach: {
          strong: "It defines the key, the limit and the client-visible behaviour (429 + Retry-After), and treats the limiter's latency and availability as requirements.",
          challenge: "\"Why not just limit by IP?\" — Many users can share one IP (corporate NAT, mobile carriers), so API keys or user IDs are fairer; IP limits suit anonymous traffic.",
        },
      },
      {
        id: "scale",
        prompt: "Estimate memory for 10M active keys, and the extra load the limiter itself creates.",
        answer: [
          "10M keys × ~100 bytes (key, count or tokens, timestamp) ≈ **1 GB** — fits in memory on a small Redis cluster.",
          "If the API serves 50k requests/s, the limiter performs **50k checks/s** — each must be a single fast in-memory operation.",
        ],
        coach: {
          strong: "It sizes both memory and the load the limiter adds — easy to forget, since every request now makes an extra call.",
          challenge: "\"What about one huge customer?\" — Their key lives on a single Redis shard; keep per-key work O(1), and consider local pre-aggregation for very hot keys.",
        },
      },
      {
        id: "api",
        prompt: "Where does the limiter live, and what does it check?",
        answer: [
          "Usually middleware in the API gateway or each service: `allow(key, rule) → {allowed, remaining, reset_at}`.",
          "Rules (limits per tier and endpoint) are configuration, cached in memory on each node.",
        ],
        coach: {
          strong: "Keeping the limiter in middleware or the gateway keeps it out of business logic and gives one consistent response format.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch how many API servers share one limit.",
        answer: [
          "Clients → load balancer → API servers with limiter middleware → shared Redis holding the counters or tokens, updated atomically (`INCR` + `EXPIRE`, or a Lua script for a token bucket).",
          "Responses include `X-RateLimit-Remaining` and `Retry-After` so well-behaved clients back off.",
        ],
        coach: {
          strong: "It shows how many servers share one limit and why the check-and-update must be atomic.",
          challenge: "\"Isn't a Redis call on every request expensive?\" — Around a millisecond in-region; if that's too much, combine a local token bucket with periodic syncing to Redis.",
        },
      },
      {
        id: "deep-dive",
        prompt: "Compare at least two limiting algorithms, including how each handles bursts.",
        answer: [
          "**Fixed window:** a counter per key per minute — simple and cheap, but a client can send the full limit at the end of one window and again at the start of the next: up to 2× the limit within seconds.",
          "**Sliding window log:** store each request's timestamp and count the last 60 s — exact, but memory grows with the limit.",
          "**Sliding window counter:** weight the previous window's count by how much of it still overlaps — a close approximation at fixed-window cost.",
          "**Token bucket:** tokens refill at a steady rate up to a capacity; each request spends one. Allows controlled bursts while enforcing the average — a common default.",
        ],
        coach: {
          strong: "It compares algorithms on accuracy, memory and burst behaviour, and explains the fixed-window edge burst precisely.",
          challenge: "\"Which would you pick?\" — Usually a token bucket: real clients are bursty, the average is still enforced, and state per key is just two numbers.",
        },
      },
      {
        id: "failures",
        prompt: "What if Redis is slow or down?",
        answer: [
          "Decide **fail-open** (allow traffic — risk overload) or **fail-closed** (reject — the limiter causes an outage). Many APIs fail open with a local fallback limit; security-sensitive endpoints such as login may fail closed.",
          "Use short timeouts on Redis calls so the limiter never adds seconds of latency, and switch to the local fallback when they fail.",
        ],
        coach: {
          strong: "It treats the limiter as a dependency that can fail, and chooses behaviour per endpoint rather than globally.",
          challenge: "\"Login endpoint, Redis down — open or closed?\" — Closed, or a strict local limit: brute-force protection matters more than availability for that endpoint.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "Exact global counts or speed?",
        answer: [
          "A central Redis gives accurate global limits at the cost of a network hop. Local per-node limits are faster but approximate (limit ÷ number of nodes, skewed when traffic is uneven). Many systems combine a local limiter with periodic synchronisation.",
        ],
        coach: {
          strong: "It names the accuracy-versus-latency trade-off and offers a hybrid instead of insisting on exactness.",
        },
      },
    ],
    followUps: [
      { q: "How do you avoid race conditions when incrementing?", short: "Use atomic operations (INCR) or a Lua script so check-and-update happens in one step." },
      { q: "How would you rate-limit per region?", short: "Keep counters per region and accept approximate global limits, or sync them asynchronously." },
      { q: "How would you support different limits per pricing tier?", short: "Store tier → limit rules in config, cache them on each node, and include the tier/endpoint in the key, e.g. rl:{api_key}:{endpoint}." },
    ],
    wrapUp: [
      "Limiter middleware at the gateway, keyed by API key or user (IP only for anonymous traffic).",
      "Token bucket in Redis, updated atomically by a Lua script; ~1 GB for 10M keys.",
      "HTTP 429 with Retry-After and remaining-quota headers.",
      "Fail open with a local fallback for most endpoints; fail closed (or strict) for login.",
    ],
  },

  {
    slug: "notification-system",
    title: "Design a notification service",
    level: "Intermediate",
    minutes: 35,
    summary: "Fan out push, email and SMS reliably with queues, retries, user preferences and provider rate limits.",
    outcome: "Design a fan-out pipeline that delivers push, email and SMS reliably, respecting preferences, provider limits and retries.",
    simulatorProblem: "Notification System",
    concepts: ["message-queues", "reliability-patterns", "databases", "api-data-modeling"],
    steps: [
      {
        id: "requirements",
        prompt: "Which channels, which guarantees, and which user controls?",
        answer: [
          "**Clarifying questions:** transactional messages (receipts, one-time passcodes) only, or marketing campaigns too? Which channels? Per-channel preferences?",
          "**Functional:** send push, email and SMS triggered by other services; respect user preferences and opt-outs; track delivery status.",
          "**Non-functional:** no lost notifications (at-least-once), no duplicate spam, handle campaign bursts, transactional messages delivered within seconds.",
        ],
        coach: {
          strong: "It distinguishes urgent transactional messages from bulk campaigns — which later justifies separate priorities.",
          challenge: "\"Can a marketing campaign delay a one-time passcode?\" — It mustn't: transactional messages get their own high-priority queues and workers.",
        },
      },
      {
        id: "scale",
        prompt: "Estimate peak throughput for a 10M-recipient campaign sent within 10 minutes, and the status data it creates.",
        answer: [
          "**Throughput:** 10M ÷ 600 s ≈ **~17k notifications/s** at peak.",
          "**Provider limits:** email, SMS and push providers enforce their own send rates, which vary by provider and account — so we queue and throttle per provider instead of sending as fast as we can.",
          "**Status data:** one row per notification, ~1 KB → ~10 GB per campaign; keep recent history hot and archive the rest.",
        ],
        coach: {
          strong: "It turns a burst into a sustained rate and recognises that the real bottleneck may be external: provider limits.",
          challenge: "\"What if a provider allows only 1k/s?\" — The campaign takes ~3 hours. Fine for marketing, not for passcodes — hence separate priorities.",
        },
      },
      {
        id: "api",
        prompt: "Define the internal API and key tables.",
        answer: [
          "`POST /notifications {user_id, template_id, data, channels?, idempotency_key}` → `202 Accepted`.",
          "Tables: `preferences(user_id, channel, enabled)`, `devices(user_id, token)`, `notifications(id, user_id, channel, status, attempts)`.",
        ],
        coach: {
          strong: "The idempotency key on the API means a retrying producer can't trigger duplicate notifications.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch the pipeline from request to provider.",
        answer: [
          "Producers → Notification API (validate, dedupe by idempotency key, check preferences) → per-channel queues (push / email / SMS), with separate high-priority queues for transactional messages → channel workers → providers (APNs/FCM, email, SMS).",
          "Workers update delivery status; failed sends go to retry queues, then a dead-letter queue.",
        ],
        coach: {
          strong: "It decouples producers from slow, flaky providers and isolates channels and priorities from each other.",
          challenge: "\"Why not call providers directly from the API?\" — Provider latency and outages would leak into every producer; queues absorb bursts and enable retries.",
        },
      },
      {
        id: "deep-dive",
        prompt: "Why separate queues per channel, and how do you stay within provider quotas?",
        answer: [
          "Channels fail and throttle independently — an SMS provider outage shouldn't block push. Each channel's workers scale separately.",
          "Workers apply a per-provider rate limit (e.g. a token bucket) so we stay within quotas instead of being throttled or blocked.",
          "Routing: a topic exchange (`notify.email`, `notify.push`, …) or separate queues per channel and priority.",
        ],
        coach: {
          strong: "It connects queue topology to failure isolation and to external quotas — a reason for every queue.",
        },
      },
      {
        id: "failures",
        prompt: "A provider times out. How do you avoid both losing and duplicating notifications?",
        answer: [
          "Manual acks + retries with exponential backoff and jitter; after N attempts, dead-letter and alert.",
          "Pass an idempotency key to providers where supported, and record `(idempotency_key, channel)` as sent, so redeliveries don't double-send.",
        ],
        coach: {
          strong: "It addresses both directions of failure — loss and duplication — with concrete mechanisms.",
          challenge: "\"Can you guarantee exactly-once delivery to the phone?\" — No; providers and networks are at-least-once at best. We minimise duplicates and keep messages harmless if one is repeated.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "What's the trade-off of strict ordering?",
        answer: [
          "Strict per-user ordering requires partitioning by user and processing each partition sequentially, which limits parallelism. Most notifications don't need it — accept reordering for throughput, except for sequences that must arrive in order.",
        ],
        coach: {
          strong: "It recognises ordering as a cost to pay only where needed, not a default.",
        },
      },
    ],
    followUps: [
      { q: "How do you schedule notifications for later?", short: "Store scheduled jobs and enqueue them when due (a scheduler service), or use delayed delivery." },
      { q: "How do you respect quiet hours?", short: "Check the user's preferences and time zone in the API or worker, and defer by re-queueing with a delay." },
      { q: "How would you track delivery and opens?", short: "Providers send delivery callbacks (webhooks) that update each notification's status; opens and clicks need tracking links or pixels, within privacy limits." },
    ],
    wrapUp: [
      "Notification API with idempotency keys and preference checks, returning 202.",
      "Per-channel, per-priority queues so campaigns never delay passcodes and one provider outage doesn't block others.",
      "Workers throttle to provider quotas, retry with backoff, dead-letter after N attempts and dedupe sends.",
      "Delivery status tracked per notification via provider callbacks.",
    ],
  },

  {
    slug: "file-storage",
    title: "Design a file storage service",
    level: "Intermediate",
    minutes: 35,
    summary: "Uploads, downloads and sharing at scale — object storage, presigned URLs, multipart uploads and metadata.",
    outcome: "Design upload and download paths for large files with presigned URLs, multipart uploads, metadata and sharing.",
    simulatorProblem: "Dropbox / File Sync",
    concepts: ["cdn-object-storage", "databases", "message-queues", "estimation"],
    steps: [
      {
        id: "requirements",
        prompt: "What must users be able to do with files, and what matters most?",
        answer: [
          "**Clarifying questions:** maximum file size? Simple upload/download or folder sync across devices? Sharing model — links, per-user permissions?",
          "**Functional:** upload, download, list, share via link, delete; files up to several GB.",
          "**Non-functional:** never lose a file (high durability); resumable uploads on bad networks; fast downloads worldwide.",
        ],
        coach: {
          strong: "Durability and resumability are named up front — they drive the storage choice and the multipart upload design.",
          challenge: "\"Do we need sync across devices?\" — That adds versioning and a change log per user; say you'd design upload/download first, then extend.",
        },
      },
      {
        id: "scale",
        prompt: "10M daily users upload 2 files/day averaging 2 MB. Estimate file storage and metadata growth.",
        answer: [
          "**Files:** 10M × 2 × 2 MB = **40 TB/day** → ~15 PB/year before replication — clearly object storage, not a database.",
          "**Metadata:** 20M files/day × ~500 bytes ≈ **10 GB/day** — a database, sharded by owner as it grows.",
        ],
        coach: {
          strong: "It separates the two data types — bytes and metadata — whose very different sizes call for different stores.",
        },
      },
      {
        id: "api",
        prompt: "Design the upload flow API.",
        answer: [
          "`POST /files {name, size}` → `{file_id, upload_urls[]}` (presigned, one per part); the client uploads parts directly; `POST /files/{id}/complete` finalises.",
          "`GET /files/{id}` → presigned download URL. Metadata: `files(id, owner_id, name, size, storage_key, status, created_at)`.",
        ],
        coach: {
          strong: "Separating \"start upload\" from \"complete\" lets the server know exactly which uploads finished — and clean up the rest.",
        },
      },
      {
        id: "architecture",
        prompt: "Which components carry bytes, and which carry metadata?",
        answer: [
          "**Metadata path:** client → load balancer → API servers → metadata database.",
          "**Byte path:** client ↔ object storage directly via presigned URLs, with a CDN for popular downloads.",
          "Upload-complete events go on a queue for virus scanning, thumbnails and search indexing.",
        ],
        coach: {
          strong: "Keeping bytes off the API servers is the central decision — it's what lets the API tier stay small and cheap.",
          challenge: "\"Isn't a presigned URL a security risk?\" — It's short-lived and scoped to one object and method, issued only after an authorisation check.",
        },
      },
      {
        id: "deep-dive",
        prompt: "How do you support resumable multi-GB uploads?",
        answer: [
          "Multipart upload: split into parts (e.g. 8 MB), upload them in parallel, retry only failed parts, then complete. Track uploaded parts so the client can resume after a disconnect.",
          "Per-part checksums detect corruption; the complete call verifies all parts are present.",
        ],
        coach: {
          strong: "It explains why parts help — parallelism, partial retries, resumption — and adds integrity checks.",
        },
      },
      {
        id: "failures",
        prompt: "The client crashes mid-upload. What's left behind, and how is durability ensured?",
        answer: [
          "Orphaned parts and a file stuck in `uploading`. A lifecycle rule or background job aborts incomplete uploads after N hours and deletes the metadata row.",
          "Object storage replicates data across devices and zones; for extra safety, replicate the bucket to another region.",
        ],
        coach: {
          strong: "It cleans up partial state explicitly and explains where durability comes from rather than just asserting it.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "Should you deduplicate identical files?",
        answer: [
          "Content hashing saves storage for common files but adds hashing cost and privacy concerns (it can reveal that someone else stores the same file). It's often done per user, or skipped.",
        ],
        coach: {
          strong: "It weighs a cost saving against a privacy risk instead of assuming dedupe is always good.",
        },
      },
    ],
    followUps: [
      { q: "How do share links stay secure?", short: "Unguessable tokens with optional expiry; downloads go through an authorisation check that issues a short-lived presigned URL." },
      { q: "How would you sync folders across devices?", short: "Track file versions and a per-user change log; clients pull deltas since their last cursor and upload only changed files (or changed blocks)." },
    ],
    wrapUp: [
      "Bytes in object storage via presigned multipart uploads; ~40 TB/day.",
      "Metadata in a database sharded by owner; ~10 GB/day.",
      "Async processing (scanning, thumbnails, indexing) triggered by upload events.",
      "Downloads through a CDN; incomplete uploads cleaned up by lifecycle rules.",
    ],
  },

  {
    slug: "chat-app",
    title: "Design a chat application",
    level: "Intermediate",
    minutes: 40,
    summary: "Real-time delivery over WebSockets, message storage, ordering and offline delivery for a write-heavy workload.",
    outcome: "Design real-time messaging: WebSocket routing, ordering, offline delivery and storage for a write-heavy workload.",
    simulatorProblem: "WhatsApp / Messaging",
    concepts: ["load-balancing", "databases", "message-queues", "replication-sharding"],
    steps: [
      {
        id: "requirements",
        prompt: "1:1 or groups? Delivery guarantees? History?",
        answer: [
          "**Clarifying questions:** group size limit? Multiple devices per user? End-to-end encryption? How long is history kept?",
          "**Functional:** 1:1 and small group chats, message history, delivered/read receipts, online status.",
          "**Non-functional:** low latency (< 200 ms delivery when online), messages never lost, ordered within a conversation.",
        ],
        coach: {
          strong: "\"Ordered within a conversation\" — not globally — is precise, and it shapes the data model and partitioning later.",
          challenge: "\"Multiple devices?\" — Then each device keeps its own cursor (last sequence number seen) and syncs from storage.",
        },
      },
      {
        id: "scale",
        prompt: "50M DAU sending 40 messages/day. Messages/s and storage?",
        answer: [
          "2B messages/day ÷ 10⁵ ≈ **20k/s** average, ~50k/s at peak.",
          "At ~200 bytes each: 400 GB/day → **~150 TB/year** before replication.",
          "**So:** write-heavy, partitionable by conversation.",
        ],
        coach: {
          strong: "It identifies the workload as write-heavy — the opposite of a feed — which drives the storage choice.",
        },
      },
      {
        id: "api",
        prompt: "How do clients send and receive?",
        answer: [
          "A persistent **WebSocket** per online client for push in both directions; REST for history (`GET /conversations/{id}/messages?cursor=`).",
          "`messages(conversation_id, seq, message_id, sender_id, body, created_at)` keyed by `(conversation_id, seq)` for ordered reads.",
        ],
        coach: {
          strong: "Choosing a push channel (WebSockets) for live messages and a pull API for history fits each access pattern.",
        },
      },
      {
        id: "architecture",
        prompt: "How does a message reach a user connected to a different server?",
        answer: [
          "Clients hold WebSockets to chat servers (behind a load balancer that supports long-lived connections). A presence/session store maps user → chat server.",
          "The sender's server persists the message, then routes it to the recipient's server (via pub/sub or a queue), which pushes it down the socket. Offline users get a push notification and fetch on reconnect.",
        ],
        coach: {
          strong: "It solves the actual routing problem — locating the recipient's server — instead of drawing one box called \"chat service\".",
          challenge: "\"Why not deliver messages through the database?\" — Polling adds latency and load; push over WebSockets with storage as the source of truth gives both speed and durability.",
        },
      },
      {
        id: "deep-dive",
        prompt: "How do you guarantee ordering and no loss?",
        answer: [
          "Persist before acknowledging to the sender. Assign per-conversation sequence numbers so clients can order messages and detect gaps.",
          "Clients ack received messages; un-acked ones are re-sent on reconnect and deduplicated by `message_id`.",
        ],
        coach: {
          strong: "Sequence numbers per conversation give both ordering and gap detection — a precise mechanism, not \"use timestamps\".",
          challenge: "\"Why not timestamps?\" — Clocks on different machines drift; two messages can get out-of-order timestamps. A per-conversation counter is authoritative.",
        },
      },
      {
        id: "failures",
        prompt: "A chat server with 100k connections dies.",
        answer: [
          "Clients reconnect — with jittered backoff to avoid a thundering herd — to other servers, re-register presence, and sync missed messages from storage using their last sequence number.",
        ],
        coach: {
          strong: "Recovery relies on storage plus sequence numbers, so no message is lost even though the server held in-memory state.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "Which database, and why?",
        answer: [
          "A wide-column store partitioned by `conversation_id` handles very high write volumes with ordered reads per conversation. SQL works at smaller scale and simplifies features like search and joins.",
        ],
        coach: {
          strong: "The choice follows from the numbers (write-heavy, ~150 TB/year) and the access pattern (ordered reads per conversation).",
        },
      },
    ],
    followUps: [
      { q: "How would you scale large group chats (10k members)?", short: "Fan out asynchronously via queues, and let large groups pull recent messages instead of pushing every message to every member." },
      { q: "How do read receipts work?", short: "Clients send read-up-to sequence numbers; store the latest per user per conversation and push updates to participants." },
    ],
    wrapUp: [
      "WebSockets to chat servers; a presence store maps users to servers; pub/sub routes between servers.",
      "Messages persisted before acking, with per-conversation sequence numbers for ordering and gap detection.",
      "Wide-column storage partitioned by conversation for ~20k writes/s and ~150 TB/year.",
      "Reconnect with jittered backoff and sync from the last sequence number after failures.",
    ],
  },

  {
    slug: "news-feed",
    title: "Design a news feed",
    level: "Advanced",
    minutes: 45,
    summary: "Fan-out on write vs read, the celebrity problem, caching timelines and the consistency you can afford to give up.",
    outcome: "Design a feed at scale: fan-out on write vs read, the celebrity problem, timeline caching and consistency trade-offs.",
    simulatorProblem: "Twitter / Social Feed",
    concepts: ["caching", "message-queues", "replication-sharding", "databases", "cap-consistency"],
    steps: [
      {
        id: "requirements",
        prompt: "What does the feed show and how fresh must it be?",
        answer: [
          "**Clarifying questions:** chronological or ranked? Text only or media? How fresh must new posts be?",
          "**Functional:** users post; followers see a reverse-chronological (or ranked) timeline of people they follow.",
          "**Non-functional:** the timeline loads in < 200 ms; a few seconds before a post appears is acceptable (eventual consistency); very read-heavy.",
        ],
        coach: {
          strong: "Accepting a few seconds of delay is the requirement that unlocks precomputed timelines — it's stated explicitly.",
          challenge: "\"What if users must see their own post immediately?\" — Insert it into the author's own timeline synchronously (read-your-writes), and fan out to followers asynchronously.",
        },
      },
      {
        id: "scale",
        prompt: "200M DAU, each reading the feed 10×/day and posting once every 2 days. Assume ~200 followers on average.",
        answer: [
          "**Reads:** 2B/day ≈ **20k/s** (peak ~60k/s). **Writes:** 100M posts/day ≈ **1k/s**. Read:write ≈ 20:1.",
          "**Fan-out work:** 100M posts × 200 followers = 2 × 10¹⁰ timeline inserts/day ≈ **200k/s** — far more than the posts themselves.",
          "**So:** precompute timelines for fast reads, but fan-out cost is the thing to manage.",
        ],
        coach: {
          strong: "It computes fan-out work, not just posts — the number that actually decides the architecture.",
        },
      },
      {
        id: "api",
        prompt: "Endpoints and core data.",
        answer: [
          "`POST /posts`, `GET /feed?cursor=`, `POST /follow/{user_id}`.",
          "`posts(post_id, author_id, body, created_at)`, `follows(follower_id, followee_id)`, and a cached timeline per user: a list of post IDs.",
        ],
        coach: {
          strong: "Storing post IDs (not full posts) in timelines keeps them small and lets edits and deletes apply everywhere.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch the write path and the read path.",
        answer: [
          "**Write:** the post service stores the post and publishes an event; fan-out workers push the post ID into each follower's cached timeline (e.g. Redis lists).",
          "**Read:** the feed service reads the user's timeline IDs from cache, hydrates posts from a post cache, and returns a page.",
        ],
        coach: {
          strong: "Write work moves to asynchronous workers so reads stay a cheap cache lookup.",
        },
      },
      {
        id: "deep-dive",
        prompt: "Fan-out on write vs fan-out on read?",
        answer: [
          "**On write (push):** fast reads, but an account with 50M followers triggers 50M inserts per post.",
          "**On read (pull):** cheap writes, but every feed load merges posts from many followees — slow at scale.",
          "**Hybrid:** push for most accounts; for very high-follower accounts, pull their recent posts at read time and merge. A common answer to the celebrity problem.",
        ],
        coach: {
          strong: "It compares both strategies on their actual costs and uses a hybrid where each is weakest.",
          challenge: "\"Where's the cut-off for 'celebrity'?\" — A follower-count threshold tuned by measuring fan-out cost; the exact number is an operational choice.",
        },
      },
      {
        id: "failures",
        prompt: "The fan-out backlog grows during a viral event.",
        answer: [
          "The queue absorbs the spike; scale fan-out workers; the delay is acceptable per the requirements. Monitor queue depth and prioritise active users' timelines.",
        ],
        coach: {
          strong: "It relies on the stated freshness requirement to tolerate delay instead of over-provisioning for every spike.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "What do you give up with cached timelines?",
        answer: [
          "Memory cost and staleness: deleted or edited posts must be filtered at read time. Keep only the latest few hundred post IDs per timeline and fall back to pulling for deeper pages.",
          "Skip fan-out for long-inactive users and rebuild their timeline when they return.",
        ],
        coach: {
          strong: "It caps memory deliberately and handles the long tail (deep pages, inactive users) separately.",
        },
      },
    ],
    followUps: [
      { q: "How would you add ranking?", short: "Fetch candidate posts from the timeline, score them with a ranking service, and cache the ranked page briefly." },
      { q: "How do you handle inactive users?", short: "Skip fan-out for users inactive for weeks; build their timeline on demand when they return." },
    ],
    wrapUp: [
      "Posts stored once; post IDs fanned out asynchronously into cached per-user timelines.",
      "Hybrid fan-out: push for most accounts, pull-and-merge for very high-follower accounts.",
      "Reads are cache lookups plus hydration — ~20k/s average — while ~200k/s of fan-out happens in workers.",
      "Eventual consistency for followers; read-your-writes for the author.",
    ],
  },

  {
    slug: "video-streaming",
    title: "Design a video streaming platform",
    level: "Advanced",
    minutes: 45,
    summary: "Upload, transcode and stream video worldwide — adaptive bitrate streaming, CDN offload and an asynchronous processing pipeline.",
    outcome: "Design an upload → transcode → stream pipeline and explain adaptive bitrate streaming, CDN offload and storage tiering.",
    simulatorProblem: "Netflix / Video Streaming",
    concepts: ["cdn-object-storage", "message-queues", "estimation", "caching", "databases"],
    steps: [
      {
        id: "requirements",
        prompt: "Who uploads, who watches, and what does \"smooth playback\" mean?",
        answer: [
          "**Clarifying questions:** user uploads (like YouTube) or a curated catalogue (like Netflix)? Live streaming or on-demand only? Which devices?",
          "**Functional:** upload a video; process it into streamable formats; watch with seeking and automatic quality changes; show metadata and view counts.",
          "**Non-functional:** playback starts quickly (≲ 2 s) with few stalls; uploads are never lost; global audience; processing may take minutes.",
        ],
        coach: {
          strong: "It separates the latency-critical path (playback) from the path that can be slow (processing) — the key to the whole design.",
          challenge: "\"What about live streaming?\" — A different problem with seconds-level ingest and segmenting; say you'd treat it as an extension.",
        },
      },
      {
        id: "scale",
        prompt: "Assume 50M daily viewers watching 30 minutes each at ~3 Mbit/s, and 500k uploads/day averaging 10 minutes. Estimate egress and storage.",
        answer: [
          "**Watch time:** 50M × 30 min = 1.5 × 10⁹ minutes ≈ 9 × 10¹⁰ seconds of video per day.",
          "**Egress:** 9 × 10¹⁰ s × 3 Mbit/s ≈ 2.7 × 10¹⁷ bits ≈ **34 PB/day** — about **3 Tbit/s** on average, more at peak.",
          "**New storage:** originals at ~0.5 GB per 10-minute upload ≈ 250 TB/day; a ladder of ~4 renditions (~9 Mbit/s combined, ~0.7 GB per video) adds ~350 TB/day → **~0.6 PB/day** before replication.",
          "**So:** bandwidth dominates everything — CDN offload is the centre of the design; storage is large but cheap in tiered object storage.",
        ],
        coach: {
          strong: "It shows that bandwidth — not QPS or storage — is the defining constraint, so the design centres on CDNs.",
          challenge: "\"Can't we serve video from our own servers?\" — At ~3 Tbit/s on average, you need very large numbers of servers close to viewers; that is exactly what CDNs (and ISP-embedded caches) provide.",
        },
      },
      {
        id: "api",
        prompt: "Define the upload API and how the player fetches video.",
        answer: [
          "`POST /videos {title, size}` → `{video_id, upload_urls[]}` (presigned multipart); `POST /videos/{id}/complete` starts processing.",
          "`GET /videos/{id}` → metadata plus a manifest URL. The player fetches the **manifest** (HLS `.m3u8` or DASH `.mpd`), which lists renditions and short segments (2–6 s each), then fetches segments from the CDN.",
          "Tables: `videos(id, owner_id, title, status, duration, created_at)`, `renditions(video_id, resolution, bitrate, manifest_key)`; view counts aggregated asynchronously.",
        ],
        coach: {
          strong: "It shows the player never streams one big file — manifests and small segments are what make caching and quality switching work.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch the upload/processing path and the playback path.",
        answer: [
          "**Upload:** client → presigned multipart upload → object storage (originals) → \"upload complete\" event → queue.",
          "**Processing:** workers split the video into chunks, encode each chunk into every rendition in parallel, package segments and manifests, write them to object storage, then mark the video ready.",
          "**Playback:** player → API (metadata, manifest URL) → CDN for manifests and segments → origin storage only on cache misses.",
        ],
        coach: {
          strong: "Two independent paths: a slow, parallel, retryable pipeline for processing, and a CDN-first path for playback.",
          challenge: "\"How long does processing take?\" — With chunked parallel encoding, time depends on chunk length and worker count rather than video length — minutes, given enough workers.",
        },
      },
      {
        id: "deep-dive",
        prompt: "How does adaptive bitrate streaming work, and why short segments?",
        answer: [
          "Each video is encoded at several bitrates and resolutions (a \"ladder\") and cut into short segments aligned across renditions.",
          "The player measures recent throughput and its buffer level and, for each next segment, picks the highest rendition it can sustain — switching quality without interrupting playback.",
          "Short segments make CDN caching effective (popular segments are shared across viewers) and make seeking cheap (start from the nearest segment).",
        ],
        coach: {
          strong: "It explains the mechanism — per-segment rendition choice driven by throughput and buffer — rather than just naming HLS.",
          challenge: "\"Why not one big MP4 with byte-range requests?\" — Fine for simple playback, but you lose seamless quality switching across renditions; segmented ladders are the standard for adaptive streaming.",
        },
      },
      {
        id: "failures",
        prompt: "A transcoding worker crashes mid-job, and a new video goes viral.",
        answer: [
          "**Worker crash:** chunk jobs come from a queue with acks; unacked jobs are redelivered. Outputs are written to deterministic keys, so a retry overwrites instead of duplicating.",
          "**Corrupt upload:** fails every time → cap retries, mark the video failed, notify the uploader (dead-letter the job).",
          "**Viral video:** many edges miss at once → tiered caching / an origin shield so the origin serves each segment roughly once; pre-warm popular titles.",
        ],
        coach: {
          strong: "It applies queue semantics (acks, idempotent outputs, retry caps) to the pipeline and handles the miss storm on the read side.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "How many renditions should you store, and for how long?",
        answer: [
          "More renditions → smoother playback on varied networks, but more encoding cost and storage. Rarely watched videos can get a smaller ladder or be re-encoded on demand.",
          "Tier storage by popularity: hot videos in standard storage and the CDN; cold originals in cheaper archival storage.",
          "A commercial CDN is the sensible default; very large platforms add caches inside ISP networks to cut transit costs.",
        ],
        coach: {
          strong: "It tunes cost against quality by popularity — the realistic lever in video systems.",
        },
      },
    ],
    followUps: [
      { q: "How would you count views accurately at this scale?", short: "Players send view events to a log or queue; stream processing aggregates them in batches. Counts are approximate in real time and exact eventually." },
      { q: "How do you protect premium content?", short: "Short-lived signed CDN URLs or cookies plus DRM-encrypted segments; a licence server checks entitlements before issuing keys." },
      { q: "How would you add live streaming?", short: "Ingest a stream, segment and transcode it within seconds, publish rolling manifests with short TTLs through the CDN — latency becomes the main new constraint." },
    ],
    wrapUp: [
      "Uploads go straight to object storage via presigned multipart URLs.",
      "An event-driven, chunked transcoding pipeline produces an adaptive bitrate ladder of short segments plus manifests.",
      "Playback fetches manifests and segments from a CDN, with an origin shield absorbing misses.",
      "Bandwidth (~3 Tbit/s average in this estimate) is the defining constraint; storage is tiered by popularity.",
    ],
  },

  {
    slug: "ecommerce",
    title: "Design an e-commerce backend",
    level: "Advanced",
    minutes: 45,
    summary: "Catalogue, cart, checkout and inventory — where read-heavy browsing meets correctness-critical orders and payments.",
    outcome: "Design checkout and inventory so you never oversell or double-charge, while keeping browsing fast and available.",
    simulatorProblem: "Amazon / E-Commerce Platform",
    concepts: ["databases", "caching", "message-queues", "reliability-patterns", "cap-consistency", "api-data-modeling"],
    steps: [
      {
        id: "requirements",
        prompt: "What's in scope, and which parts need to be correct above all?",
        answer: [
          "**Clarifying questions:** single seller or marketplace? Flash sales? Which parts are in scope — catalogue, search, cart, checkout, order tracking?",
          "**Functional:** browse and search products; cart; checkout (pay and create an order); track orders.",
          "**Non-functional:** browsing is fast and highly available; checkout is correct above all — never oversell, never charge twice; order history is durable.",
        ],
        coach: {
          strong: "It splits the system by consistency needs up front: browsing can be eventually consistent, checkout cannot.",
          challenge: "\"Can the product page show slightly stale stock?\" — Yes, as long as checkout re-checks stock authoritatively.",
        },
      },
      {
        id: "scale",
        prompt: "Assume 20M daily users, 30 page views each, 2% placing an order, and peaks of 5× average during sales.",
        answer: [
          "**Reads:** 20M × 30 = 6 × 10⁸ page views/day ÷ 10⁵ ≈ **6,000/s**; × 5 at peak ≈ **30,000/s**.",
          "**Orders:** 20M × 2% = 400k/day ≈ **4–5/s** average, ~25/s at peak — small, but every one must be correct.",
          "**Order storage:** 400k × ~2 KB ≈ 0.8 GB/day ≈ **300 GB/year** — comfortably relational.",
          "**So:** scale the read side with caching, a CDN and a search index; keep the write side simple, transactional and correct.",
        ],
        coach: {
          strong: "It exposes the asymmetry — huge read traffic, tiny but critical write traffic — which justifies designing each side differently.",
          challenge: "\"What about a flash sale: 1M users for 1,000 items?\" — Then writes contend on a few hot rows; see the deep dive.",
        },
      },
      {
        id: "api",
        prompt: "Define the key endpoints and tables.",
        answer: [
          "`GET /products/{id}`, `GET /search?q=` (served from a search index), `POST /cart/items`, `POST /checkout {cart_id, payment_method}` with an `Idempotency-Key` header → order.",
          "Tables: `products`, `inventory(product_id, available, reserved)`, `orders(id, user_id, status, total, created_at)`, `order_items`, `payments(order_id, provider_ref, status)`.",
        ],
        coach: {
          strong: "Checkout carries an idempotency key, so a retried checkout can't create two orders or two charges.",
        },
      },
      {
        id: "architecture",
        prompt: "Sketch the browse path and the checkout path.",
        answer: [
          "**Browse:** CDN for images and static assets → product service with a cache in front of the catalogue database → search service backed by a search index updated asynchronously from catalogue changes.",
          "**Cart:** a per-user cart in a fast store (Redis or a key-value database), merged on login.",
          "**Checkout:** the order service reserves stock → creates a pending order → calls the payment provider → marks the order paid, then publishes `order.placed` for email, fulfilment and analytics via a queue.",
        ],
        coach: {
          strong: "Different storage and consistency per path, connected by events instead of long synchronous chains.",
          challenge: "\"Why not one database for everything?\" — You can start there; separating search and caching matters once browse traffic would starve checkout or search needs its own index.",
        },
      },
      {
        id: "deep-dive",
        prompt: "How do you prevent overselling the last item?",
        answer: [
          "**Atomic conditional update:** `UPDATE inventory SET available = available - 1 WHERE product_id = ? AND available >= 1` succeeds for exactly one of two concurrent buyers; the other sees 0 rows updated.",
          "**Reservations:** decrement when checkout starts, with an expiry (e.g. 10 minutes); release the stock if payment fails or times out.",
          "**Flash sales:** contention on one row → queue purchase requests and process them sequentially per product, or pre-allocate stock tokens, and show users their place in line.",
        ],
        coach: {
          strong: "It uses a precise mechanism — a conditional atomic update — rather than \"use transactions\", and handles the extreme case separately.",
          challenge: "\"Why not read the stock, then decrement?\" — Two requests can both read 1 and both decrement: a race. Check and decrement must be one atomic operation.",
        },
      },
      {
        id: "failures",
        prompt: "Payment succeeds, but your service crashes before marking the order paid.",
        answer: [
          "**Idempotency:** checkout and the payment call share an idempotency key, so retries don't charge twice.",
          "**Reconciliation:** the provider's webhook updates the order, and a background job queries the provider for orders stuck in `pending`.",
          "**Outbox pattern:** write the order status change and the `order.placed` event in the same database transaction (an outbox table); a relay publishes it, so the event is never lost or sent for a rolled-back order.",
        ],
        coach: {
          strong: "It accepts that an external payment provider can't join your database transaction, and uses idempotency and reconciliation instead.",
          challenge: "\"Why not a distributed transaction (2PC) with the provider?\" — External providers don't take part in your transactions; idempotency keys, sagas and reconciliation are the practical tools.",
        },
      },
      {
        id: "tradeoffs",
        prompt: "Where do you accept eventual consistency, and where not?",
        answer: [
          "**Eventual:** search results, recommendations, reviews, stock shown on product pages, order-history views.",
          "**Strong:** the stock decrement at checkout, payment state, order creation.",
          "**Transactions vs sagas:** while inventory and orders share one database, a local transaction is simplest. Once they're separate services, a saga with compensating actions (release stock, refund) replaces it.",
        ],
        coach: {
          strong: "It makes per-operation consistency decisions and names the condition under which the design should change.",
        },
      },
    ],
    followUps: [
      { q: "How would you implement search?", short: "A search index (e.g. Elasticsearch/OpenSearch) fed by catalogue change events; search queries never touch the transactional database." },
      { q: "How do you handle price changes during checkout?", short: "Snapshot the price into the order and validate it against the current price; if it changed, ask the user to confirm." },
      { q: "How would you support many sellers (a marketplace)?", short: "Partition catalogue and inventory by seller, add a seller service, route order events per seller, and handle split payouts in payments." },
    ],
    wrapUp: [
      "Read side: CDN, cached product service and a separate search index for ~30k page views/s at peak.",
      "Write side: transactional orders with atomic conditional stock decrements and expiring reservations.",
      "Payments via idempotency keys, webhooks and reconciliation; events published through an outbox.",
      "Strong consistency for stock and payments, eventual consistency for everything users browse.",
    ],
  },
];
