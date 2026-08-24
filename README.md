# Sari-Salo

An offline-first point-of-sale app for small Filipino food stalls, with a live kitchen display.

I built Sari-Salo to go beyond basic CRUD applications and work through problems involving offline storage, background syncing, concurrent updates, retries, and real-time communication between the cashier and kitchen.

## What it does

- Cashiers can browse products, build a cart, and place orders even without an internet connection.
- Orders are saved locally first and automatically synced when the connection comes back.
- A separate kitchen display receives order updates in real time.
- Kitchen staff can move orders through `New → Preparing → Ready → Complete`.
- Failed syncs are surfaced to the cashier instead of silently failing.

## Why I built it

My previous projects gave me experience with CRUD, authentication, and dashboards, but I wanted to work on problems where the application couldn't simply assume that the network or server was always available.

The main challenge was making sure an order could safely move between:

**Cashier → Local storage → Sync queue → API → PostgreSQL → Kitchen**

without creating duplicates or accidentally overwriting newer changes.

## Engineering challenges

### Offline-first order creation

Orders are written to the browser's IndexedDB database using Dexie before attempting to reach the server.

This means a cashier can continue creating orders during an internet outage. A background sync engine later processes the queued operations when connectivity is restored.

### Safe retries and idempotency

Each order gets a UUID generated on the client.

The same ID is used when syncing the order to the server, allowing the API to safely recognize retries of the same order instead of creating duplicates.

### Conflict resolution

Multiple devices can potentially update the same order.

Sari-Salo uses a **last-write-wins (LWW)** strategy based on `clientModifiedAt`.

There is also an important rule around local changes:

> An unresolved local mutation takes priority over an incoming Realtime update.

This prevents an inbound update from overwriting a change that the device hasn't finished syncing yet.

### Retry and failure handling

Not every sync failure means the same thing.

- Network and server errors are retried with backoff.
- Permanent API errors, such as invalid order data, stop retrying.
- Orders that permanently fail are marked as needing manual attention.
- The cashier can see whether a failure was a server rejection or a retry limit being reached.

### Real-time kitchen updates

The kitchen display uses Supabase Realtime for live order updates.

The API remains the authoritative source for the initial snapshot, while Realtime provides subsequent changes.

This keeps the kitchen display responsive without making Realtime the only source of truth.

## Tech Stack

- **Next.js 16 + TypeScript + Tailwind CSS** — application and UI
- **PostgreSQL + Supabase** — server-side database
- **Prisma** — database access
- **Dexie / IndexedDB** — offline browser storage
- **Supabase Realtime** — live order updates
- **Zod** — API request validation

### Routes

- Cashier: `/`
- Kitchen: `/kitchen`

## Data flow

```text
Cashier creates order
        ↓
Saved to IndexedDB immediately
        ↓
Added to local sync queue
        ↓
Internet connection becomes available
        ↓
Sync engine sends order to API
        ↓
API validates and saves to PostgreSQL
        ↓
Supabase Realtime broadcasts changes
        ↓
Kitchen display updates
```

## Known limitations

Sari-Salo is intentionally a v1 portfolio project, so some production features are outside the current scope.

### No authentication

There is currently no login or role-based access control.

Anyone with access to the application can use the cashier or kitchen screens. This is acceptable for the intended single-location demo, but it would need to be addressed before a public production deployment.

### Last-write-wins conflict resolution

Conflict resolution uses last-write-wins rather than a more advanced merge strategy such as CRDTs.

This keeps the system simpler, but concurrent changes can result in one update winning over another.

### Terminal identity uses browser storage

Each terminal has a locally persisted ID.

Clearing the browser's site data creates a new terminal identity. A production system would need proper device registration and management.

### Offline orders are invisible to the kitchen

The kitchen only receives an order after it successfully reaches the server.

If the cashier remains offline, the kitchen cannot see that order until synchronization succeeds.

### Order number collisions

Order numbers use a per-terminal sequence and prefix.

This is sufficient for the intended small-scale use case, but a larger multi-terminal deployment would need stronger guarantees around human-readable order-number uniqueness.

### Limited order management

The Recent Orders panel is intentionally minimal.

It shows recent orders and identifies orders that need attention, but does not currently support editing, refunds, or manual retry actions.

### Anonymous database access

The current Supabase RLS setup allows anonymous read access to order data because the application does not have an authentication system yet.

This is a documented v1 tradeoff and would need to change before production deployment.

## What I'd build next

If I continued developing Sari-Salo, the next priorities would be:

1. Authentication and role-based access
2. Manual recovery for permanently failed orders
3. Inventory tracking
4. Sales reporting and shift analytics
5. Stronger terminal/device management

## Development process

I built Sari-Salo iteratively, working through the system in phases rather than trying to design everything at once.

I used Claude as an implementation and brainstorming partner, while reviewing the architecture, testing behavior, and investigating edge cases throughout development.

Several parts of the project went through multiple iterations after finding issues involving race conditions, synchronization, and failure handling.

That process was an important part of the project: the goal wasn't just to make a POS that worked on the happy path, but to understand what happens when the network fails, requests are retried, multiple devices interact with the same data, or something goes wrong.

## Project status

Sari-Salo is a completed v1 portfolio project focused on demonstrating practical experience with:

- Offline-first application design
- IndexedDB and local persistence
- Background synchronization
- Idempotent APIs
- Conflict resolution
- Retry and failure handling
- PostgreSQL data modeling
- Real-time communication
- Concurrency and race-condition analysis

```

```
