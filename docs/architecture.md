# QuickNotes Architecture and Scaling Plan

## 1. Assumptions and estimates

These are planning estimates, not measured production traffic:

- 1,000,000 registered users; assume 10% are active daily = 100,000 daily active users.
- Each active user reads 50 note/feed pages and creates 1 note per day.
- Average stored note text and metadata is 2 KB.
- All notes are retained. Base storage excludes indexes, backups, replicas, attachments, and logs.
- One day is 86,400 seconds; peak traffic is estimated as 5 times average traffic.

**Reads:** 100,000 × 50 = 5,000,000 reads/day. Average = 5,000,000 / 86,400 ≈ **57.9 reads/second**; peak ≈ **290 reads/second**.

**Writes:** 100,000 × 1 = 100,000 note creations/day. Average = 100,000 / 86,400 ≈ **1.16 writes/second**; peak ≈ **5.8 writes/second**. Edits, deletes, tags, and other operations would add traffic.

**Storage:** 100,000 × 2 KB = 200 MB/day using decimal units; 200 MB × 365 = **73 GB/year** of new note text and metadata, before indexes, backups, replicas, and operational overhead.

This workload is read-heavy: estimated reads are 50 times note-creation writes. Use caching and a read replica for suitable reads, while sending writes to the primary database.

## 2. Architecture diagram

```text
            Browser / Mobile Client
                       |
                       v
                    +------+
                    | DNS  |
                    +------+
                       |
                       v
                    +------+
                    | CDN  | <---- Static assets
                    +------+
                       |
                       v
                 +-------------+
                 | Load        |
                 | Balancer    |
                 +-------------+
                    |       |
                    v       v
                +-------+ +-------+
                | App A | | App B |   (or more app servers)
                +-------+ +-------+
                    |       |
             +------+-------+-------+
             |              |       |
             v              v       v
          +-------+   +----------+ +-------+
          | Cache |   | Primary  | | Queue |
          +-------+   | Database | +-------+
                      +----------+     |
                           |           v
                      replication  +--------+
                           v       | Worker |
                     +-----------+ +--------+
                     | Read      |
                     | Replica   |
                     +-----------+
```

The CDN mainly caches static frontend assets; if note attachments are added, object storage can be added as their file origin.

## 3. Component responsibilities

- **Client:** gives users the interface to create, read, update, and delete notes.
- **DNS:** resolves the service hostname to its network endpoint.
- **CDN:** serves cached static assets near users, reducing latency and origin traffic.
- **Load balancer:** distributes requests across healthy app servers.
- **App servers:** validate requests, enforce authorization, run business logic, and access cache/database services.
- **Cache:** keeps frequently requested data temporarily to reduce repeated database reads.
- **Primary database:** stores durable user, note, and tag data and handles writes and transactions.
- **Read replica:** serves suitable read queries and reduces load on the primary database.
- **Queue:** buffers asynchronous jobs so a request does not have to wait for background work.
- **Worker:** processes queued tasks such as notifications or search indexing, with retries for temporary failures.

## 4. GET /notes flow

1. Client resolves the hostname through DNS and sends an HTTPS request.
2. Load balancer routes the request to a healthy app server.
3. App server validates the access token and identifies the user.
4. App checks the cache for that user's requested notes and pagination cursor.
5. On a cache hit, return cached data; on a miss, query the read replica when suitable.
6. App returns JSON notes and pagination metadata and may cache the result briefly.
7. Client renders notes and shows loading, success, empty, or error feedback.

## 5. POST /notes flow

1. Client sends HTTPS `POST /notes` with a JSON title and optional body.
2. Load balancer forwards the request to a healthy app server.
3. App authenticates the user and validates the request and title.
4. App writes the note to the primary database in a transaction, deriving the owner from the authenticated identity.
5. After the write succeeds, app returns `201 Created` and the created note.
6. App invalidates or updates relevant cached note lists.
7. If follow-up work is needed, app publishes a job to the queue and a worker processes it asynchronously.

## 6. Trade-offs

### Cache speed versus freshness
Caching reduces latency and database load, but a cached list can be stale after a note changes. Use short TTLs or targeted invalidation, and never rely on cache data to make authorization decisions.

### Read replicas versus consistency
Replicas scale reads but can lag behind the primary. Use the primary for read-after-write cases that require immediate visibility and replicas for reads that can tolerate a short delay.

### Background work versus immediate completion
Queues keep slow work out of the request path, but jobs may be delayed or fail. Use retry/backoff, idempotent jobs, dead-letter handling, and queue monitoring.

### Redundancy versus cost
Multiple app servers, replicated infrastructure, and redundant network services improve availability but increase cost and operational complexity. Apply redundancy according to the service's availability requirements.

## 7. Avoiding single points of failure

- Run at least two app servers on separate instances or failure zones and configure health checks on the load balancer.
- Use managed/redundant DNS and CDN services rather than one manually maintained endpoint.
- Configure database backups and tested primary failover; a read replica alone is not a backup.
- Use a durable replicated queue and workers that can restart or scale horizontally.
- Monitor latency, error rates, replica lag, queue age, disk use, and backup success; regularly test recovery procedures.

A diagram alone does not guarantee high availability: the actual deployment must configure and test these redundancy and failover mechanisms.
