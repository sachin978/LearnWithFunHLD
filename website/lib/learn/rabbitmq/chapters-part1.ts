import type { Chapter } from "@/lib/learn/types";

export const CHAPTERS_PART_1: Chapter[] = [
  // ─── 1 ─────────────────────────────────────────────────────────────────────
  {
    id: "why-broker",
    number: 1,
    title: "Why do we need a message broker?",
    navTitle: "Why a message broker?",
    minutes: 7,
    problem:
      "Services that call each other directly over HTTP are **tightly coupled in time**: the caller can only finish when every callee has answered. One slow or broken dependency makes the whole request slow or broken — even when that dependency isn't important to the user.",
    simple:
      "A message broker is a reliable post office between services. Instead of calling the email service and waiting, the order service drops a message off (\"order 101 was created\") and moves on. Whoever needs to react picks the message up later, at their own pace.",
    analogy:
      "A restaurant waiter doesn't stand in the kitchen while the chef cooks. They clip the order ticket to the rail and go back to the tables. If the kitchen is busy, tickets queue up on the rail instead of customers being turned away at the door.",
    realWorld: {
      title: "E-commerce checkout",
      body: [
        "An order API that synchronously calls **payment → inventory → email → invoice** is only as fast as the sum of those calls, and only as available as the least available of them.",
        "If the email provider takes 3 seconds, checkout takes 3 seconds. If it times out, checkout fails — even though the customer was already charged.",
        "With a broker, the API does only what must happen before responding (validate, charge, persist the order), publishes an `order.created` event, and returns. Email, invoicing and analytics workers consume that event independently.",
      ],
    },
    walkthrough: [
      "**Scenario A:** each downstream call adds its latency to the request, and the first failure aborts the whole request.",
      "**Scenario B:** the API publishes one event and returns 202 in ~40 ms. The broker routes a copy to each interested queue.",
      "Each worker consumes from its own queue. A slow email worker delays only email.",
      "When the email worker crashes before acknowledging, the message returns to the queue and is processed after recovery.",
    ],
    technical: [
      "**Synchronous** communication (HTTP/gRPC request–response) needs both sides up at the same moment. **Asynchronous** messaging decouples them in time: the producer only needs the broker to be up.",
      "A broker **buffers traffic spikes**. If 10,000 orders arrive in a minute but workers can handle 2,000/minute, the queue absorbs the burst and drains later instead of the system falling over.",
      "It **decouples producers from consumers**: the order service doesn't know (or care) how many services react to `order.created`. Adding a fraud-check consumer requires no change to the producer.",
      "What a broker does **not** solve automatically: a message can still be processed twice, processed late, or fail repeatedly. Reliability comes from acknowledgments, durable queues, persistent messages, publisher confirms, retries and idempotent consumers — later chapters.",
      "Async is not free: the user gets eventual results (\"your invoice will arrive by email\"), you need monitoring for queue depth, and debugging spans several processes.",
    ],
    mistakes: [
      { myth: "Putting a queue in front of a service makes it reliable.", reality: "It makes the caller independent of that service. Reliability still depends on acks, durability, retries and idempotency." },
      { myth: "Everything should become asynchronous.", reality: "If the user needs the result to continue (e.g. \"is my payment approved?\"), a synchronous call is often right. Move work that can happen later." },
      { myth: "Once published, the work is done.", reality: "Publishing only hands the message to the broker. Consumers can still fail — you need visibility into failures and dead letters." },
    ],
    interview: [
      {
        q: "When would you introduce a message queue into a design?",
        short: "When work can happen after the response, when producers and consumers scale differently, or when you must absorb bursts.",
        detailed: [
          "Typical triggers: slow side effects (email, PDFs, thumbnails), fan-out to several independent services, smoothing spiky load, and isolating a flaky dependency.",
          "I'd also call out the cost: eventual consistency, duplicate handling and operational monitoring of queue depth and consumer lag.",
        ],
      },
    ],
    takeaways: [
      "Synchronous chains add latency and multiply failure points.",
      "A broker decouples services in time and buffers bursts.",
      "Publishing ≠ processing. Reliability needs acks, persistence, retries and idempotency.",
    ],
    quiz: [
      {
        id: "q1-1",
        question: "Why does adding a broker improve resilience to a slow email provider?",
        options: [
          "RabbitMQ sends emails faster than the provider",
          "The order API no longer waits for email; the email message waits in a queue instead",
          "The broker retries failed HTTP calls on behalf of the API",
          "Messages can never fail once they are in RabbitMQ",
        ],
        answer: 1,
        explanation: "The request path no longer includes email. The work is buffered in a queue and processed independently, so the slow provider only delays email.",
      },
      {
        id: "q1-2",
        question: "Which problem does a broker NOT solve on its own?",
        options: ["Buffering a burst of traffic", "Decoupling producer and consumer availability", "Preventing a consumer from processing the same message twice", "Letting several services react to the same event"],
        answer: 2,
        explanation: "Redelivery after a crash can cause duplicates. Preventing duplicate business effects requires idempotent consumers.",
      },
    ],
  },

  // ─── 2 ─────────────────────────────────────────────────────────────────────
  {
    id: "architecture",
    number: 2,
    title: "RabbitMQ architecture and core terminology",
    navTitle: "Architecture & terms",
    minutes: 8,
    problem:
      "RabbitMQ's vocabulary — exchanges, bindings, routing keys, channels — trips people up because it splits \"sending a message to a queue\" into several separate pieces. Each piece exists so that producers never need to know which queues exist.",
    simple:
      "Producers send messages to an **exchange**. The exchange decides which **queues** get a copy, using rules called **bindings**. **Consumers** read from queues and say \"done\" with an **acknowledgment**.",
    analogy:
      "The exchange is a mail sorting room, bindings are the sorting rules on the wall (\"anything for orders.* → bin 3\"), queues are the bins where letters wait, and consumers are the couriers who empty a bin and sign for each letter.",
    walkthrough: [
      "The producer opens a TCP **connection** and a **channel** inside it.",
      "It publishes a message to the `orders` exchange with routing key `orders.created`.",
      "The exchange matches the routing key against bindings; `orders.*` matches.",
      "The message is stored in the `order-processing` queue.",
      "RabbitMQ delivers it to a consumer; it is now **unacknowledged**.",
      "The consumer sends `basic.ack`; RabbitMQ deletes the message.",
    ],
    technical: [
      "**Message** = properties + headers + body. Properties include `content_type`, `message_id`, `delivery_mode` (persistence), `correlation_id`, `reply_to`, `expiration`. The body is opaque bytes to RabbitMQ — it never parses your JSON.",
      "**Routing key vs payload:** routing key `orders.created` is routing metadata the exchange inspects. The payload `{\"order_id\": 101, \"status\": \"created\"}` is application data only consumers read.",
      "**Exchanges** route but never store. **Queues** store and deliver. A **binding** links an exchange to a queue, optionally with a binding key or header arguments.",
      "Producers normally publish to an exchange, not a queue. The special **default exchange** (named `\"\"`) is a direct exchange to which every queue is automatically bound by its own name — publishing to `\"\"` with routing key `report-jobs` lands in the queue `report-jobs`. That's what tutorials use when they seem to \"publish to a queue\".",
      "**Connection vs channel:** a connection is a long-lived TCP (often TLS) socket — expensive to open. Channels are lightweight virtual connections multiplexed over it. Use one connection per process and separate channels per thread/concern (e.g. one for publishing, one for consuming). Channels are not thread-safe in most clients.",
      "**Virtual host (vhost):** a namespace with its own exchanges, queues, bindings and permissions — like separate databases on one server, e.g. `/staging` and `/prod`.",
      "**Consumer acknowledgment** tells the broker a delivery was processed. **Publisher confirm** is the reverse direction: the broker tells the producer it has taken responsibility for a published message. They are independent.",
    ],
    mistakes: [
      { myth: "Producers send messages to queues.", reality: "They publish to exchanges. The default exchange only makes it look like publishing to a queue." },
      { myth: "Every consumer needs its own connection.", reality: "Connections are expensive. Share one per process and use channels for concurrency." },
      { myth: "RabbitMQ routes on the message body.", reality: "Routing uses only the routing key (or headers, for headers exchanges). The body is opaque." },
    ],
    interview: [
      {
        q: "What's the difference between an exchange and a queue?",
        short: "Exchanges route messages based on bindings and never store them; queues store messages until a consumer acknowledges them.",
        detailed: ["Decoupling them lets producers publish to a stable exchange name while the set of queues — and which consumers care — evolves independently."],
      },
      { q: "Why does RabbitMQ have channels?", short: "To multiplex many logical sessions over one TCP connection, avoiding the cost of many sockets." },
    ],
    takeaways: [
      "Producer → exchange → binding → queue → consumer.",
      "The routing key is metadata; the payload is opaque.",
      "One connection per process, many channels.",
      "Consumer acks and publisher confirms are different mechanisms.",
    ],
    quiz: [
      {
        id: "q2-1",
        question: "A message is published to exchange `orders` with routing key `orders.created` and lands in queue `order-processing`. Which part decided the destination?",
        options: ["The consumer", "The queue", "The exchange, using its bindings", "The message payload"],
        answer: 2,
        explanation: "The exchange evaluates the routing key against its bindings and delivers to matching queues.",
      },
      {
        id: "q2-2",
        question: "What does publishing to the default exchange `\"\"` with routing key `emails` do?",
        options: ["Broadcasts to every queue", "Routes to the queue named `emails`", "Fails — you must name an exchange", "Creates a queue called `emails`"],
        answer: 1,
        explanation: "Every queue is implicitly bound to the default exchange using its own name as the binding key.",
      },
    ],
  },

  // ─── 3 ─────────────────────────────────────────────────────────────────────
  {
    id: "exchanges",
    number: 3,
    title: "Exchange types and routing",
    navTitle: "Exchange types",
    minutes: 10,
    problem:
      "Different consumers care about different subsets of messages: billing wants only payment failures, analytics wants everything, the EU team wants only EU orders. Exchange types encode those rules once, inside the broker, instead of in every producer.",
    simple:
      "**Direct** = exact key match. **Fanout** = everyone gets a copy. **Topic** = pattern match on dot-separated words. **Headers** = match on header values instead of the key.",
    analogy:
      "Direct is a mailbox number. Fanout is a building-wide announcement. Topic is a mail filter like \"anything from *.example.com\". Headers is \"route by the stickers on the envelope, not the address\".",
    walkthrough: [
      "**Direct:** `orders.created` reaches both queues bound with exactly `orders.created`; `users.signup` matches nothing and is dropped.",
      "**Fanout:** the routing key is ignored; three queues each get an independent copy.",
      "**Topic:** `orders.eu.created` matches `orders.#` but not `orders.*` — `*` is exactly one word.",
      "**Headers:** with `x-match=all` every listed header must match; with `x-match=any` one is enough.",
    ],
    technical: [
      "A message can be routed to **many queues** at once — each gets its own copy. Consumers on different queues never compete with each other.",
      "**Topic routing keys** are words separated by dots. In bindings, `*` matches **exactly one** word and `#` matches **zero or more** words. So `orders.#` matches `orders`, `orders.created` and `orders.eu.created`; `orders.*` matches only `orders.created`/`orders.cancelled`; `*.failed` matches `payments.failed` but not `eu.payments.failed`.",
      "A topic binding of just `#` behaves like fanout; a topic binding with no wildcards behaves like direct.",
      "**Headers exchanges** compare binding arguments with message headers. `x-match=all` (default) requires all to match, `x-match=any` requires at least one. Headers starting with `x-` are ignored for matching unless you use `all-with-x`/`any-with-x`. Headers exchanges are flexible but less common and harder to reason about.",
      "**Unroutable messages** (no binding matched) are silently dropped by default. Set the `mandatory` flag to have them returned to the publisher (`basic.return`), or configure an **alternate exchange** on the exchange to catch them. A dead-letter exchange is a **different** feature — it handles rejected/expired messages that were already in a queue.",
      "The **default exchange** is a direct exchange that routes by queue name. Alternate exchanges are a per-exchange fallback for unroutable messages. They solve different problems.",
    ],
    mistakes: [
      { myth: "`orders.*` matches `orders.eu.created`.", reality: "`*` is exactly one word. Use `orders.#` (or `orders.*.created`) for multi-word keys." },
      { myth: "Unmatched messages go to the dead-letter queue.", reality: "They are dropped, returned (mandatory) or sent to an alternate exchange. DLX is for messages rejected or expired in a queue." },
      { myth: "Two consumers on a fanout exchange each get every message.", reality: "Only if each has its own queue. Two consumers on one queue compete regardless of exchange type." },
    ],
    interview: [
      {
        q: "How would you route events so that billing gets only payment events while analytics gets everything?",
        short: "Topic exchange: billing binds `payments.#`, analytics binds `#`, each with its own queue.",
        detailed: ["Producers publish `payments.failed`, `orders.created`, etc. New consumers just add bindings — no producer change."],
      },
    ],
    takeaways: [
      "Direct = exact, fanout = all, topic = word patterns, headers = header match.",
      "`*` is exactly one word; `#` is zero or more.",
      "Unroutable ≠ dead-lettered. Use mandatory or an alternate exchange.",
    ],
    quiz: [
      {
        id: "q3-1",
        question: "Which bindings match routing key `orders.eu.created`? (`orders.*`, `orders.#`, `*.created`, `#.created`)",
        options: ["`orders.*` and `orders.#`", "`orders.#` and `#.created`", "All four", "Only `orders.#`"],
        answer: 1,
        explanation: "The key has 3 words. `orders.*` and `*.created` match exactly 2 words. `orders.#` and `#.created` can absorb the extra word.",
      },
      {
        id: "q3-2",
        question: "A message matches no binding and the publisher did not set `mandatory`. No alternate exchange exists. What happens?",
        options: ["It goes to the dead-letter queue", "It waits in the exchange until a binding appears", "It is dropped", "The channel is closed with an error"],
        answer: 2,
        explanation: "Exchanges don't store messages. Without mandatory or an alternate exchange, unroutable messages are discarded.",
      },
    ],
  },

  // ─── 4 ─────────────────────────────────────────────────────────────────────
  {
    id: "consumers-prefetch",
    number: 4,
    title: "Queues, multiple consumers and prefetch",
    navTitle: "Consumers & prefetch",
    minutes: 8,
    problem:
      "One worker can't keep up, so you start five. How does RabbitMQ split work between them — and why does one slow worker sometimes hoard messages while the others sit idle?",
    simple:
      "Consumers on the **same queue compete**: each message goes to one of them. **Prefetch** limits how many unacknowledged messages a consumer may hold at once, so busy consumers stop receiving new work until they ack.",
    analogy:
      "A supermarket with one shared queue and several tills. Prefetch 1 means each cashier calls the next customer only when free. A high prefetch is like pre-assigning ten customers to each till — fine if every cashier is equally fast, terrible if one is slow.",
    walkthrough: [
      "Eight jobs wait; a fast and a slow consumer subscribe with the chosen prefetch.",
      "RabbitMQ delivers round-robin, but only while a consumer has free prefetch capacity.",
      "Each ack frees a slot and allows the next delivery to that consumer.",
      "With prefetch 1, the fast consumer naturally does most of the work. With a large prefetch, messages get parked behind the slow consumer.",
    ],
    technical: [
      "**Work queue / competing consumers:** many consumers on one queue. Each message is delivered to one consumer at a time. This is how you scale processing horizontally.",
      "**Fanout vs competing:** two queues bound to a fanout exchange each receive a copy. Two consumers on one queue split the messages. Choose per use case.",
      "**Prefetch** (`basic.qos(prefetch_count=N)`) caps outstanding unacked deliveries. In RabbitMQ, `global=false` (the default in most clients) applies the limit **per consumer**; `global=true` applies it **per channel**. (This differs from the original AMQP 0-9-1 spec; quorum queues don't support global QoS.)",
      "With no prefetch limit (0 = unlimited), RabbitMQ pushes messages as fast as the network allows — a slow consumer can buffer thousands of messages in memory, and nobody else can take them.",
      "Distribution is **not perfectly equal**. It depends on prefetch, ack timing and consumer speed. Round-robin only applies among consumers with free capacity.",
      "Rules of thumb: prefetch 1 for long or uneven tasks; 10–300 for fast, uniform tasks where network round trips dominate. Measure.",
      "**Backpressure:** if consumers can't keep up, queue depth grows. RabbitMQ can apply flow control to publishers when memory or disk alarms fire — a sign your system is overloaded, not a strategy.",
    ],
    mistakes: [
      { myth: "Adding consumers always splits work evenly.", reality: "Without a sensible prefetch, one slow consumer can hold a large share of messages unacked." },
      { myth: "Prefetch limits how many messages are delivered in total.", reality: "It limits how many can be unacknowledged at once. It only matters with manual acks." },
      { myth: "Consumers on a fanout exchange compete.", reality: "Consumers compete within a queue. Fanout copies to every queue." },
    ],
    interview: [
      {
        q: "One worker is slow and the queue has a backlog, but other workers are idle. Why?",
        short: "Prefetch is too high (or unlimited): the slow worker has many messages reserved but unacked.",
        detailed: ["Lower prefetch (often to 1 for long tasks), check acks are sent promptly, and consider separate queues for slow job types."],
      },
    ],
    takeaways: [
      "One queue + many consumers = competing consumers.",
      "Prefetch caps unacked messages (per consumer by default in RabbitMQ).",
      "Low prefetch = fair dispatch; high prefetch = throughput for uniform work.",
    ],
    quiz: [
      {
        id: "q4-1",
        question: "You have 3 consumers on one queue and 3 queues bound to a fanout exchange. A message is published. How many deliveries happen in each case?",
        options: ["3 and 3", "1 and 3", "3 and 1", "1 and 1"],
        answer: 1,
        explanation: "Competing consumers share one copy (1 delivery). Fanout puts a copy in each of the 3 queues.",
      },
      {
        id: "q4-2",
        question: "What does prefetch_count=1 with manual acks guarantee?",
        options: ["Messages are processed in strict global order", "Each consumer holds at most one unacked message", "Each message is delivered exactly once", "Consumers receive messages in batches of one second"],
        answer: 1,
        explanation: "It caps outstanding unacked deliveries per consumer (with RabbitMQ's default global=false).",
      },
    ],
  },

  // ─── 5 ─────────────────────────────────────────────────────────────────────
  {
    id: "acks",
    number: 5,
    title: "Acknowledgments, redelivery and consumer crashes",
    navTitle: "Acks & redelivery",
    minutes: 9,
    problem:
      "A consumer can die at any instant — before processing, halfway through, or after doing the work but before telling RabbitMQ. The broker has to choose between possibly losing a message and possibly delivering it twice.",
    simple:
      "With **manual acks**, RabbitMQ keeps a message until the consumer says \"done\". If the consumer disappears first, the message goes back to the queue. That means you may see it **again** — so consumers must handle duplicates safely.",
    analogy:
      "A courier only marks a parcel delivered once the customer signs. If the courier's van breaks down, the depot sends the parcel out again — even if the first courier had actually dropped it off but never got the signature.",
    walkthrough: [
      "Consumer 1 receives message #42 (now unacked) and charges the card.",
      "It crashes before `basic.ack`.",
      "Its connection closes; RabbitMQ requeues the unacked message with `redelivered=true`.",
      "Consumer 2 receives it and — without protection — charges again.",
      "With an idempotency key, the duplicate is detected, skipped and acked.",
    ],
    technical: [
      "**Auto-ack** (`auto_ack=True`): the message is considered acknowledged as soon as it is sent. Fastest, but a crash loses in-flight messages → **at-most-once**.",
      "**Manual ack**: the consumer calls `basic.ack(delivery_tag)` after processing. Unacked messages are requeued when the channel or connection closes → **at-least-once**.",
      "`basic.nack(requeue=True)` / `basic.reject(requeue=True)` put the message back for redelivery. With `requeue=False` the message is **dead-lettered if the queue has a DLX configured, otherwise discarded**. `nack` can also reject multiple messages at once (`multiple=True`); `reject` handles one.",
      "RabbitMQ detects dead consumers through closed TCP connections and heartbeats. It also enforces a **delivery acknowledgment timeout** (default 30 minutes): a consumer that holds a message unacked for too long has its channel closed and the message requeued.",
      "RabbitMQ can't know whether a side effect happened before a lost ack. **Exactly-once end-to-end delivery is not something RabbitMQ provides.** You get **effectively-once** processing by making consumers idempotent.",
      "**Idempotency patterns:** a unique constraint on `message_id` written in the same DB transaction as the effect; natural idempotency (\"set status = shipped\"); or passing an idempotency key to downstream APIs (e.g. payment providers).",
      "Ack on the **same channel** the message was received on. Acking a delivery tag twice, or on another channel, is a protocol error that closes the channel.",
    ],
    mistakes: [
      { myth: "RabbitMQ guarantees exactly-once delivery.", reality: "It offers at-most-once (auto-ack) or at-least-once (manual ack). Exactly-once effects require idempotent consumers." },
      { myth: "Ack immediately on receive, then process.", reality: "That's equivalent to auto-ack: a crash during processing loses the message. Ack after the work is committed." },
      { myth: "`requeue=false` sends the message to a dead-letter queue.", reality: "Only if the queue has a dead-letter exchange configured. Otherwise the message is dropped." },
      { myth: "Forgetting to ack is harmless.", reality: "Unacked messages pile up, hit the prefetch limit (consumer stalls) and eventually trigger the ack timeout." },
    ],
    interview: [
      {
        q: "How do you avoid charging a customer twice when messages can be redelivered?",
        short: "Make the consumer idempotent: record the message/idempotency key atomically with the charge and skip duplicates.",
        detailed: [
          "Producer assigns a stable `message_id`. Consumer inserts it into a processed table with a unique constraint inside the same transaction as the effect, then acks.",
          "For external payment APIs, pass the same idempotency key so the provider deduplicates too.",
        ],
      },
    ],
    takeaways: [
      "Manual ack after processing = at-least-once.",
      "A crash before ack → redelivery → possible duplicate.",
      "Idempotent consumers turn at-least-once into effectively-once.",
    ],
    quiz: [
      {
        id: "q5-1",
        question: "A consumer processes a message, writes to the DB and crashes before acking. What happens?",
        options: ["The message is lost", "The message is requeued and may be processed again", "RabbitMQ rolls back the DB write", "RabbitMQ marks the message as processed because the DB was updated"],
        answer: 1,
        explanation: "RabbitMQ only knows the delivery wasn't acked. It requeues the message with redelivered=true; the DB write is outside its knowledge.",
      },
      {
        id: "q5-2",
        question: "Which combination gives at-most-once delivery?",
        options: ["Manual ack after processing", "Auto-ack", "Publisher confirms", "Prefetch = 1"],
        answer: 1,
        explanation: "With auto-ack the message is removed when sent, so a crash loses it but it is never redelivered.",
      },
    ],
  },

  // ─── 6 ─────────────────────────────────────────────────────────────────────
  {
    id: "durability",
    number: 6,
    title: "Durability, persistence and broker restarts",
    navTitle: "Durability",
    minutes: 8,
    problem:
      "Brokers restart — deploys, crashes, host maintenance. Which messages are still there afterwards depends on three separate settings people often confuse, plus one mechanism for the producer to know a message was actually accepted.",
    simple:
      "To survive a restart you need **both** a durable queue **and** persistent messages. To know the broker actually took your message, use **publisher confirms**.",
    analogy:
      "A durable queue is a filing cabinet bolted to the floor; a transient queue is a cardboard box. Persistent messages are written in ink; transient ones are written on a whiteboard. After a power cut you need the cabinet and the ink.",
    walkthrough: [
      "Three jobs are published.",
      "Only persistent messages in a durable queue are written to disk.",
      "The node restarts and memory is wiped.",
      "Compare the outcome for each combination using the tabs.",
    ],
    technical: [
      "**Queue durability** (`durable=True` at declaration) means the queue **definition** survives a restart. A transient (non-durable) queue is deleted on restart, along with its contents.",
      "**Message persistence** (`delivery_mode=2`, \"persistent\") asks the broker to store the message on disk. It only helps if the queue is durable. Quorum queues store all messages durably regardless of delivery mode.",
      "**Declaration compatibility:** re-declaring an existing queue with different properties (e.g. `durable=False` when it exists as durable) fails with `PRECONDITION_FAILED` (406) and closes the channel. Declare queues identically everywhere, or manage them centrally.",
      "**Publisher confirms** (`confirm.select`): the broker acks each publication once it has taken responsibility — routed to queues and, for persistent messages in durable queues, written to disk (or replicated to a quorum). Unroutable messages are confirmed once the broker determines there's no route (returned first if `mandatory`).",
      "A confirm tells the **publisher** the broker has the message. A consumer **ack** tells the broker a **consumer** processed it. A confirm says nothing about consumption.",
      "Remaining failure modes: disk loss on a single node, a publisher crashing before receiving the confirm (it will re-publish → duplicates), and data on a node that never comes back. Replication (quorum queues) and idempotent consumers address these.",
    ],
    table: {
      caption: "Four mechanisms, four different guarantees",
      headers: ["Mechanism", "Set by", "Protects against", "Does not guarantee"],
      rows: [
        ["Durable queue", "Queue declaration", "Queue definition lost on restart", "That its messages survive"],
        ["Persistent message", "Publisher (`delivery_mode=2`)", "Message lost on restart (in a durable queue)", "Anything if the queue is transient"],
        ["Publisher confirm", "Publisher channel (`confirm.select`)", "Silently losing a publish in transit", "That a consumer processed it"],
        ["Consumer ack", "Consumer (`basic.ack`)", "Losing a message when a consumer crashes", "No duplicates — redelivery can repeat work"],
      ],
    },
    mistakes: [
      { myth: "A durable queue makes messages durable.", reality: "Only persistent messages are written to disk. Transient messages in a durable queue vanish on restart." },
      { myth: "Persistent messages survive in any queue.", reality: "If the queue is transient, it's deleted on restart — with its messages." },
      { myth: "A publisher confirm means the message was processed.", reality: "It means the broker accepted responsibility. Consumption is tracked by consumer acks." },
    ],
    interview: [
      {
        q: "How do you make sure an order event is not lost between the API and the worker?",
        short: "Durable queue + persistent message + publisher confirms on the producer + manual acks on the consumer (+ quorum queues for node failure).",
        detailed: [
          "For the DB-write + publish gap, use a transactional outbox: write the event to an outbox table in the same transaction as the order, and a relay publishes it with confirms.",
        ],
      },
    ],
    takeaways: [
      "Survive restart = durable queue **and** persistent message.",
      "Publisher confirms close the producer → broker gap.",
      "Confirm ≠ ack. Neither prevents duplicates.",
    ],
    quiz: [
      {
        id: "q6-1",
        question: "A durable queue holds transient messages (delivery_mode=1). The broker restarts. What remains?",
        options: ["The queue and its messages", "The queue, but empty", "Nothing", "The messages, in a new queue"],
        answer: 1,
        explanation: "Durability covers the queue definition; transient messages are not recovered.",
      },
      {
        id: "q6-2",
        question: "The producer receives a publisher confirm for message #9. What do you know?",
        options: ["A consumer processed #9", "#9 will never be delivered twice", "The broker has taken responsibility for #9", "#9 was delivered to every queue"],
        answer: 2,
        explanation: "Confirms cover publisher → broker. Processing is confirmed only by consumer acks.",
      },
    ],
  },
];
