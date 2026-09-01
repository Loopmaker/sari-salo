# Sari-Salo

An offline-first point-of-sale (POS) app for small Filipino food stalls, with a live kitchen display.

I built Sari-Salo to practice building a web app that can still work when the internet is unreliable. The project focuses on offline storage, syncing, retries, and keeping orders updated between the cashier, storefront, and kitchen.

## What it does

- Cashiers can browse products, build a cart, and place orders even when offline.
- Orders are saved locally and automatically synced when the connection comes back.
- Customers can order ahead from the storefront without creating an account.
- The kitchen display receives orders from both the cashier and storefront.
- Kitchen staff can move orders through `New → Preparing → Ready → Complete`.
- Failed syncs are shown to the cashier instead of failing silently.

## Why I built it

My earlier projects mostly focused on CRUD features, authentication, and dashboards. For this project, I wanted to learn more about what happens when the network is unreliable.

The main flow I worked on was:

**Cashier → Local storage → Sync queue → API → PostgreSQL → Kitchen**

I also wanted to understand how to avoid duplicate orders, handle failed requests, and deal with multiple devices updating the same order.

## Main features

### Offline-first orders

Orders are saved to the browser's IndexedDB using Dexie before being sent to the server.

This allows the cashier to continue creating orders when the internet is unavailable. Once the connection comes back, the sync process sends the pending orders to the API.

### Safe retries

Each order gets a UUID on the client before it is sent to the server.

The same ID is reused when an order is retried. The API uses this ID to prevent the same order from being created twice.

This is used by both the cashier and storefront checkout.

### Conflict handling

Multiple devices can update the same order.

Sari-Salo uses a simple **last-write-wins (LWW)** approach based on `clientModifiedAt`.

Local changes that have not finished syncing are also protected from being overwritten by incoming Realtime updates.

### Retry and failure handling

The sync system handles different types of failures:

- Temporary network/server errors are retried with increasing delays.
- Invalid requests are not retried forever.
- Orders that permanently fail are marked for manual attention.
- The cashier can see when an order needs attention.

### Kitchen updates

The kitchen display uses Supabase Realtime for live order updates.

The API is used for the initial order list, while Realtime is used to receive changes afterward.

Supabase Realtime is currently affected by a `PoolingReplicationError` in my project. I checked the database publication, permissions, and replica identity setup and also reset the Realtime configuration while investigating the issue.

As a temporary fallback, the kitchen display polls the API every 12 seconds. This means orders can still update automatically, although they may take a few seconds to appear.

## Tech Stack

- **Next.js 16 + TypeScript + Tailwind CSS** — application and UI
- **PostgreSQL + Supabase** — database and backend services
- **Prisma** — database access
- **Dexie / IndexedDB** — offline browser storage
- **Supabase Realtime** — live order updates
- **Zod** — API validation

## Routes

- Cashier: `/`
- Storefront: `/storefront`
- Kitchen: `/kitchen`

## Data flow

```text
Cashier creates order
        ↓
Saved to IndexedDB
        ↓
Added to sync queue
        ↓
Internet becomes available
        ↓
Sync engine sends order to API
        ↓
API validates and saves to PostgreSQL
        ↓
Supabase Realtime sends the update
        ↓
Kitchen display updates
```

## Known limitations

Sari-Salo is a **v1 portfolio project**, so it does not include everything a production POS system would need.

### No authentication

There is currently no login or role-based access control.

Anyone who can access the application can open the cashier or kitchen screens. This is acceptable for the current demo but would need to be changed for a real deployment.

### Simple conflict resolution

The app uses last-write-wins instead of a more advanced conflict resolution system.

This keeps the implementation easier to understand, but one update can replace another when multiple devices change the same order.

### Terminal identity uses browser storage

Each cashier terminal has a locally stored ID.

Clearing the browser's site data creates a new terminal identity. A production system would need proper device registration.

### Offline orders are not visible to the kitchen

An order created while offline will not appear on the kitchen display until it successfully syncs with the server.

### Kitchen updates can be delayed

Supabase Realtime is currently not working reliably in the project, so the kitchen display uses API polling every 12 seconds as a fallback.

This can cause a short delay before new orders or status changes appear.

### Order number limitations

Cashier order numbers use a terminal prefix and local sequence, while storefront orders use a daily counter.

This works for the current small-scale setup, but a larger system would need stronger guarantees for unique order numbers.

### Limited order management

The Recent Orders section is intentionally simple.

It shows recent orders and highlights orders that need attention, but does not currently support refunds, editing, or manual retry actions.

### No storefront order history

After placing an order, customers can see their order number on the confirmation screen, but they cannot look up the order again after closing the page.

### Anonymous database access

The current application does not have authentication, so the Supabase security rules are limited for this v1 version.

This would need to be improved before using the application in production.

## What I'd build next

If I continued developing Sari-Salo, I would work on:

1. Authentication and role-based access
2. Better recovery tools for failed orders
3. Inventory tracking
4. Sales reports and shift analytics
5. Better terminal/device management
6. Storefront order tracking
7. Revisit the Realtime and polling setup once the Supabase issue is resolved

## Development process

I built Sari-Salo in several phases instead of trying to build everything at once.

I started with the cashier and kitchen features, then added the storefront ordering flow later.

I used Claude as an implementation and brainstorming tool, while reviewing the code, testing features, and investigating problems myself.

The project went through several iterations after finding issues with synchronization, retries, race conditions, and checkout idempotency.

One useful part of the project was testing what happens outside the normal "everything works" scenario — such as losing the internet, retrying requests, having multiple devices update an order, or dealing with a third-party service problem.

## Project status

Sari-Salo is an actively developed **v1 portfolio project**.

The project demonstrates my experience with:

- Offline-first web applications
- IndexedDB and local storage
- Background synchronization
- API idempotency
- Basic conflict resolution
- Retry and error handling
- PostgreSQL
- Prisma
- Supabase
- Real-time updates
- Concurrency and race-condition handling
- Debugging third-party service issues
