import type { DesignWalkthrough } from "./types";

export const DESIGNS: DesignWalkthrough[] = [
  {
    slug: "url-shortener",
    title: "Design a URL shortener",
    level: "Beginner",
    minutes: 30,
    summary: "The classic warm-up: ID generation, a read-heavy redirect path and caching.",
    simulatorProblem: "URL Shortener",
    concepts: ["estimation", "api-data-modeling", "databases", "caching", "load-balancing"],
    steps: [
      {
        id: "requirements",
        prompt: "List the core features and 2–3 non-functional requirements before revealing.",
        answer: [
          "**Functional:** create a short link for a long URL; redirect a short link to the original; optional custom alias and expiry.",
          "**Non-functional:** redirects must be fast (<50 ms server time) and highly available; links must not collide; analytics can be eventually consistent.",
        ],
      },
      {
        id: "scale",
        prompt: "Assume 100M new links/month and a 100:1 read/write ratio. Estimate writes/s, reads/s and 5-year storage.",
        answer: [
          "Writes: 100M ÷ (30 × 10⁵ s) ≈ **~40/s**. Reads: ×100 ≈ **~4,000/s** (peak ~10k/s).",
          "Storage: 100M × 12 months × 5 years = 6B links × ~500 bytes ≈ **3 TB**.",
          "Conclusion: very read-heavy → optimise the redirect path with caching.",
        ],
      },
      {
        id: "api",
        prompt: "Define the endpoints and the main table.",
        answer: [
          "`POST /urls {long_url, custom_alias?, expires_at?}` → `{short_code}`; `GET /{short_code}` → `301/302` redirect.",
          "Table `links(short_code PK, long_url, user_id, created_at, expires_at)`. The only hot query is lookup by `short_code` — a key-value access pattern.",
        ],
      },
      {
        id: "architecture",
        prompt: "Sketch the request path for a redirect.",
        answer: [
          "Client → load balancer → stateless app servers → cache (Redis) → database.",
          "Redirect: check cache by short_code → on miss read DB and fill cache → return redirect. Creation writes to DB (and optionally warms the cache).",
        ],
      },
      {
        id: "deep-dive",
        prompt: "How do you generate short codes that never collide?",
        answer: [
          "**Base62 of a unique ID:** 62⁷ ≈ 3.5 trillion codes in 7 characters. Get unique IDs from a counter service that hands out ranges to each app server (no per-request coordination).",
          "**Alternative:** hash the URL and take a prefix — needs collision checks and makes the same URL map to the same code (sometimes desirable).",
          "Random IDs are guessable-resistant but need a uniqueness check on insert.",
        ],
      },
      {
        id: "failures",
        prompt: "What breaks first at 10× traffic, and what if the cache fails?",
        answer: [
          "Hot links (a viral tweet) concentrate reads on a few keys — the cache absorbs them; add a CDN/edge cache for 301s if needed.",
          "Cache down → reads fall back to DB: add read replicas so the DB survives, and rate-limit creation to stop abuse.",
        ],
      },
      {
        id: "tradeoffs",
        prompt: "301 or 302 redirects — which and why?",
        answer: [
          "**301 (permanent)** lets browsers cache the redirect: less load, but you lose per-click analytics. **302 (temporary)** sends every click to you: accurate analytics, more load.",
          "SQL vs key-value store: both work at ~3 TB; a key-value store fits the access pattern, SQL keeps it simple and supports user queries.",
        ],
      },
    ],
    followUps: [
      { q: "How would you add click analytics without slowing redirects?", short: "Publish a click event to a queue/log on redirect and aggregate asynchronously." },
      { q: "How do you handle expired links?", short: "Check expires_at on read and return 404/410; clean up with a background job." },
    ],
  },

  {
    slug: "rate-limiter",
    title: "Design a rate limiter",
    level: "Beginner",
    minutes: 25,
    summary: "Limit requests per client across many servers with low latency.",
    simulatorProblem: "API Rate Limiter",
    concepts: ["reliability-patterns", "caching", "load-balancing"],
    steps: [
      {
        id: "requirements",
        prompt: "Who is limited, by what key, and what happens when they exceed the limit?",
        answer: [
          "Limit by user ID / API key (or IP for anonymous traffic), e.g. 100 requests per minute per key, with different tiers.",
          "Exceeding returns **HTTP 429** with a `Retry-After` header. The limiter must add minimal latency and must not become a single point of failure.",
        ],
      },
      {
        id: "scale",
        prompt: "Estimate memory for 10M active keys.",
        answer: ["A counter + timestamp ≈ 50–100 bytes per key → 10M keys ≈ **~1 GB** — fits comfortably in a Redis cluster."],
      },
      {
        id: "api",
        prompt: "Where does the limiter live and what does it check?",
        answer: [
          "Usually middleware in the API gateway or each service: `allow(key, rule) → {allowed, remaining, reset_at}`.",
          "Rules (limits per tier/endpoint) are config, cached in memory on each node.",
        ],
      },
      {
        id: "architecture",
        prompt: "Sketch how many API servers share one limit.",
        answer: ["Clients → load balancer → API servers with limiter middleware → shared Redis holding counters (atomic `INCR` + `EXPIRE`, or a Lua script for token bucket)."],
      },
      {
        id: "deep-dive",
        prompt: "Compare two algorithms.",
        answer: [
          "**Fixed window:** count per minute bucket — simple, but allows up to 2× bursts at window edges.",
          "**Sliding window log/counter:** smoother, slightly more memory/compute.",
          "**Token bucket:** tokens refill at a steady rate up to a capacity — allows short bursts while enforcing an average. Common default.",
        ],
      },
      {
        id: "failures",
        prompt: "What if Redis is slow or down?",
        answer: [
          "Decide **fail-open** (allow traffic, risk overload) vs **fail-closed** (reject, risk outage). Most public APIs fail open with a local in-memory fallback limit.",
          "Use short timeouts on Redis calls so the limiter never adds seconds of latency.",
        ],
      },
      {
        id: "tradeoffs",
        prompt: "Exact global counts vs speed?",
        answer: ["A central Redis gives accurate global limits at the cost of a network hop. Local per-node limits are faster but approximate (limit ÷ N nodes). Many systems combine both."],
      },
    ],
    followUps: [
      { q: "How do you avoid race conditions when incrementing?", short: "Use atomic operations (INCR) or a Lua script so check-and-update happens in one step." },
      { q: "How would you rate-limit per region?", short: "Keep counters per region and accept approximate global limits, or sync asynchronously." },
    ],
  },

  {
    slug: "notification-system",
    title: "Design a notification service",
    level: "Intermediate",
    minutes: 35,
    summary: "Fan out push, email and SMS reliably with queues, retries and user preferences.",
    simulatorProblem: "Notification System",
    concepts: ["message-queues", "reliability-patterns", "databases", "api-data-modeling"],
    steps: [
      {
        id: "requirements",
        prompt: "Which channels, which guarantees, and which user controls?",
        answer: [
          "Send push, email and SMS triggered by other services; respect user preferences and opt-outs; track delivery status.",
          "Non-functional: no lost notifications (at-least-once), no spamming duplicates, high throughput bursts (e.g. marketing campaigns), soft real-time (seconds).",
        ],
      },
      {
        id: "scale",
        prompt: "Estimate peak throughput for 10M notifications in a 10-minute campaign.",
        answer: ["10M ÷ 600 s ≈ **~17k/s** at peak — far above what third-party providers accept per account, so we must queue and rate-limit sending."],
      },
      {
        id: "api",
        prompt: "Define the internal API and key tables.",
        answer: [
          "`POST /notifications {user_id, template_id, data, channels?, idempotency_key}` → 202 Accepted.",
          "Tables: `preferences(user_id, channel, enabled)`, `devices(user_id, token)`, `notifications(id, user_id, channel, status, attempts)`.",
        ],
      },
      {
        id: "architecture",
        prompt: "Sketch the pipeline from request to provider.",
        answer: [
          "Producers → Notification API (validate, dedupe by idempotency key, check preferences) → per-channel queues (push / email / SMS) → channel workers → providers (APNs/FCM, email, SMS).",
          "Workers update delivery status; failed sends go to retry queues, then a DLQ.",
        ],
      },
      {
        id: "deep-dive",
        prompt: "Why separate queues per channel?",
        answer: [
          "Channels fail and throttle independently — an SMS provider outage shouldn't block push. Each channel's workers scale and rate-limit to its provider's quota.",
          "A topic exchange (e.g. `notify.email`, `notify.push`) or separate queues implements this routing.",
        ],
      },
      {
        id: "failures",
        prompt: "A provider times out. How do you avoid both losing and duplicating notifications?",
        answer: [
          "Manual acks + retries with exponential backoff and jitter; after N attempts, dead-letter and alert.",
          "Pass an idempotency key to providers where supported and record sent IDs, so redeliveries don't double-send.",
        ],
      },
      {
        id: "tradeoffs",
        prompt: "What's the trade-off of strict ordering?",
        answer: ["Strict per-user ordering requires partitioning by user and fewer parallel consumers. Most notifications don't need it — accept reordering for throughput, except for sequences like OTP codes."],
      },
    ],
    followUps: [
      { q: "How do you schedule notifications for later?", short: "Store scheduled jobs and enqueue when due (scheduler service), or use delayed delivery." },
      { q: "How do you respect quiet hours?", short: "Check preferences/time zone in the API or worker; defer by re-queueing with a delay." },
    ],
  },

  {
    slug: "file-storage",
    title: "Design a file storage service",
    level: "Intermediate",
    minutes: 35,
    summary: "Uploads, downloads and sharing at scale — object storage, presigned URLs and metadata.",
    simulatorProblem: "Dropbox / File Sync",
    concepts: ["cdn-object-storage", "databases", "message-queues", "estimation"],
    steps: [
      {
        id: "requirements",
        prompt: "What must users be able to do with files?",
        answer: [
          "Upload, download, list, share via link, delete; files up to several GB.",
          "Non-functional: never lose files (high durability), resumable uploads on bad networks, fast downloads worldwide.",
        ],
      },
      {
        id: "scale",
        prompt: "10M users upload 2 files/day averaging 2 MB. Storage per year?",
        answer: ["10M × 2 × 2 MB = 40 TB/day → **~15 PB/year** before replication. Clearly object storage, not a database."],
      },
      {
        id: "api",
        prompt: "Design the upload flow API.",
        answer: [
          "`POST /files {name, size}` → `{file_id, upload_urls[]}` (presigned, one per chunk); client uploads chunks directly; `POST /files/{id}/complete`.",
          "`GET /files/{id}` → presigned download URL. Metadata table: `files(id, owner_id, name, size, storage_key, status, created_at)`.",
        ],
      },
      {
        id: "architecture",
        prompt: "Which components carry bytes, and which carry metadata?",
        answer: [
          "Metadata path: client → LB → API servers → metadata DB. Byte path: client ↔ object storage directly via presigned URLs, with a CDN for downloads.",
          "Upload-complete events go on a queue for virus scanning, thumbnails and search indexing.",
        ],
      },
      {
        id: "deep-dive",
        prompt: "How do you support resumable multi-GB uploads?",
        answer: ["Multipart upload: split into e.g. 8 MB chunks, upload in parallel, retry only failed chunks, then complete. Track uploaded parts so the client can resume."],
      },
      {
        id: "failures",
        prompt: "The client crashes mid-upload. What's left behind?",
        answer: ["Orphaned parts and a file stuck in `uploading`. A lifecycle rule/background job aborts incomplete uploads after N hours and deletes the metadata row."],
      },
      {
        id: "tradeoffs",
        prompt: "Deduplicate identical files?",
        answer: ["Content hashing saves storage for common files but adds hashing cost and privacy concerns (revealing that someone else has the same file). Often done per user or skipped."],
      },
    ],
    followUps: [
      { q: "How do share links stay secure?", short: "Unguessable tokens with optional expiry; download goes through an authorisation check that issues a short-lived presigned URL." },
      { q: "How would you sync folders across devices?", short: "Track file versions and a per-user change log; clients pull deltas since their last cursor." },
    ],
  },

  {
    slug: "chat-app",
    title: "Design a chat application",
    level: "Intermediate",
    minutes: 40,
    summary: "Real-time delivery over WebSockets, message storage and online presence.",
    simulatorProblem: "WhatsApp / Messaging",
    concepts: ["load-balancing", "databases", "message-queues", "replication-sharding"],
    steps: [
      {
        id: "requirements",
        prompt: "1:1 or groups? Delivery guarantees? History?",
        answer: [
          "1:1 and small group chats, message history, delivered/read receipts, online status.",
          "Non-functional: low latency (<200 ms delivery when online), messages never lost, ordered within a conversation.",
        ],
      },
      {
        id: "scale",
        prompt: "50M DAU sending 40 messages/day. Messages/s and storage?",
        answer: ["2B messages/day ÷ 10⁵ ≈ **20k/s** (peak ~50k/s). At ~200 bytes each: 400 GB/day → ~150 TB/year. Write-heavy and partitionable by conversation."],
      },
      {
        id: "api",
        prompt: "How do clients send and receive?",
        answer: [
          "A persistent **WebSocket** per online client for push in both directions; REST for history (`GET /conversations/{id}/messages?cursor=`).",
          "`messages(conversation_id, message_id, sender_id, body, created_at)` keyed by (conversation_id, message_id) for ordered reads.",
        ],
      },
      {
        id: "architecture",
        prompt: "How does a message reach a user connected to a different server?",
        answer: [
          "Clients hold WebSockets to chat servers (behind an L4/L7 LB supporting long-lived connections). A presence/session store maps user → chat server.",
          "Sender's server persists the message, then routes it to the recipient's server (via pub/sub or a queue) which pushes it down the socket. Offline users get a push notification and fetch on reconnect.",
        ],
      },
      {
        id: "deep-dive",
        prompt: "How do you guarantee ordering and no loss?",
        answer: [
          "Persist before acknowledging to the sender. Assign per-conversation sequence numbers (or time-ordered IDs) so clients can order and detect gaps.",
          "Clients ack received messages; un-acked ones are re-sent on reconnect, deduplicated by message_id.",
        ],
      },
      {
        id: "failures",
        prompt: "A chat server with 100k connections dies.",
        answer: ["Clients reconnect (with jittered backoff to avoid a thundering herd) to other servers, re-register presence, and sync missed messages from storage using their last sequence number."],
      },
      {
        id: "tradeoffs",
        prompt: "Which database and why?",
        answer: ["A wide-column store partitioned by conversation_id handles huge write volumes with ordered reads per conversation; SQL works at smaller scale and simplifies features like search and joins."],
      },
    ],
    followUps: [
      { q: "How would you scale large group chats (10k members)?", short: "Fan out asynchronously via queues, and let large groups pull rather than push every message to every member." },
      { q: "How do read receipts work?", short: "Clients send read-up-to sequence numbers; store the latest per user per conversation and push updates to participants." },
    ],
  },

  {
    slug: "news-feed",
    title: "Design a news feed",
    level: "Advanced",
    minutes: 45,
    summary: "Fan-out on write vs read, caching timelines and the celebrity problem.",
    simulatorProblem: "Twitter / Social Feed",
    concepts: ["caching", "message-queues", "replication-sharding", "databases", "cap-consistency"],
    steps: [
      {
        id: "requirements",
        prompt: "What does the feed show and how fresh must it be?",
        answer: [
          "Users post; followers see a reverse-chronological (or ranked) timeline of people they follow.",
          "Non-functional: timeline loads in <200 ms; a few seconds of delay before a post appears is acceptable (eventual consistency); very read-heavy.",
        ],
      },
      {
        id: "scale",
        prompt: "200M DAU, each reading the feed 10×/day and posting once every 2 days.",
        answer: ["Reads: 2B/day ≈ **20k/s** (peak ~60k/s). Writes: 100M/day ≈ **1k/s**. Read:write ≈ 20:1 — precompute for reads."],
      },
      {
        id: "api",
        prompt: "Endpoints and core data.",
        answer: [
          "`POST /posts`, `GET /feed?cursor=`, `POST /follow/{user}`.",
          "`posts(post_id, author_id, body, created_at)`, `follows(follower_id, followee_id)`, and a cached timeline per user: list of post_ids.",
        ],
      },
      {
        id: "architecture",
        prompt: "Sketch the write path and the read path.",
        answer: [
          "Write: post service stores the post, publishes an event; fan-out workers push the post_id into each follower's cached timeline (Redis lists).",
          "Read: feed service reads the user's timeline post_ids from cache, hydrates posts (from a post cache), returns a page.",
        ],
      },
      {
        id: "deep-dive",
        prompt: "Fan-out on write vs fan-out on read?",
        answer: [
          "**On write (push):** fast reads, but a user with 50M followers triggers 50M writes per post.",
          "**On read (pull):** cheap writes, but every feed load merges many authors' posts — slow.",
          "**Hybrid:** push for normal users; pull for celebrities at read time and merge. The standard answer.",
        ],
      },
      {
        id: "failures",
        prompt: "The fan-out backlog grows during a viral event.",
        answer: ["Queue absorbs the spike; scale fan-out workers; delay is acceptable per requirements. Monitor queue depth; prioritise active users' timelines."],
      },
      {
        id: "tradeoffs",
        prompt: "What do you give up with cached timelines?",
        answer: ["Memory cost and staleness (deleted/edited posts must be filtered at read time). Keep only the latest ~800 post_ids per timeline and fall back to pull for deeper pages."],
      },
    ],
    followUps: [
      { q: "How would you add ranking?", short: "Fetch candidate posts (from the timeline), score them with a ranking service, cache the ranked page briefly." },
      { q: "How do you handle inactive users?", short: "Skip fan-out for users inactive for weeks; build their timeline on demand when they return." },
    ],
  },
];
