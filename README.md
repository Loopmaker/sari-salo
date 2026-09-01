# Sari-Salo

An offline-capable point-of-sale (POS) app for small Filipino food stalls, with a kitchen display and customer order-ahead page.

The cashier can create orders even without an internet connection. Orders are saved locally in IndexedDB and synced with the backend once the connection comes back.

The kitchen currently depends on the backend, so orders created while the cashier is offline will only appear in the kitchen after they successfully sync.

I built Sari-Salo to learn more about offline storage, background syncing, retries, and keeping data consistent between different parts of a web app.

## What it does

- Cashiers can browse products, build a cart, and create orders while offline.
- Orders are saved locally and synced automatically when the connection returns.
- Customers can order ahead from the storefront without creating an account.
- The kitchen display receives orders from both the cashier and storefront.
- Kitchen staff can move orders through `New → Preparing → Ready → Complete`.
- Failed syncs are shown to the cashier instead of failing silently.

## Why I built it

My earlier projects mostly focused on CRUD features, authentication, and dashboards. For this project, I wanted to work on something where the app could not always depend on the internet being available.

The main challenge was figuring out how to save an order locally, sync it later, and make sure retries would not create duplicate orders.

The main flow is:

**Cashier → Local storage → Sync queue → API → PostgreSQL → Kitchen**

This project also gave me a chance to learn about things I had not worked with much before, such as IndexedDB, background synchronization, idempotent APIs, and handling updates from multiple devices.

## Main Features

### Offline-capable cashier

Orders are saved to the browser's IndexedDB using Dexie before being sent to the server.

This means the cashier can continue creating orders when the internet is unavailable. Once the connection comes back, the sync process sends the pending orders to the API.

The kitchen does not receive these orders while the cashier is offline. It only receives them after they successfully reach the backend.

### Safe retries

Each order gets a UUID on the client before it is sent to the server.

The same ID is reused when an order is retried. The API checks this ID so the same order is not accidentally created twice.

This is used by both the cashier and storefront checkout.

### Conflict handling

Multiple devices can update the same order.

Sari-Salo uses a simple **last-write-wins (LWW)** approach based on `clientModifiedAt`.

There is also a rule that protects local changes that have not finished syncing from being overwritten by incoming Realtime updates.

### Retry and failure handling

The sync system handles different types of failures:

- Temporary network or server errors are retried with increasing delays.
- Invalid requests are not retried forever.
- Orders that permanently fail are marked for manual attention.
- The cashier can see when an order needs attention.

### Kitchen updates

The kitchen display uses Supabase Realtime for live order updates.

The API provides the initial order list, while Realtime is used to receive changes afterward.

At the moment, Supabase Realtime is not working reliably in this project because of a `PoolingReplicationError`. I investigated the database publication, permissions, and replica identity setup and also reset the Realtime configuration while troubleshooting it.

As a fallback, the kitchen display polls the API every 12 seconds. This means orders still update automatically, but there can be a short delay.

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

## Data Flow

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

```

## Known Limitations

Sari-Salo is a **v1 portfolio project**, so it does not include everything a production POS system would need.

### No authentication

There is currently no login or role-based access control.

Anyone who can access the application can open the cashier or kitchen screens. This is acceptable for the current demo but would need to be changed for a real deployment.

### Offline orders are not visible to the kitchen

The cashier can create and save orders while offline, but the kitchen depends on the backend.

An offline order will only appear on the kitchen display after the cashier reconnects and the order successfully syncs.

### Simple conflict resolution

The app uses last-write-wins instead of a more advanced conflict resolution system.

This keeps the implementation simpler, but one update can replace another when multiple devices change the same order.

### Terminal identity uses browser storage

Each cashier terminal has a locally stored ID.

Clearing the browser's site data creates a new terminal identity. A production system would need proper device registration.

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

The application does not have authentication yet, so the current Supabase security setup is limited for this v1 version.

This would need to be improved before using the application in production.

## What I'd Build Next

If I continued developing Sari-Salo, I would work on:

1. Authentication and role-based access
2. Better recovery tools for failed orders
3. Inventory tracking
4. Sales reports and shift analytics
5. Better terminal/device management
6. Storefront order tracking
7. Revisit the Realtime and polling setup once the Supabase issue is resolved

## Development Process

I built Sari-Salo in several phases instead of trying to build everything at once.

I started with the cashier and kitchen features, then added the storefront ordering flow later.

I used Claude as an implementation and brainstorming tool, while reviewing the code, testing features, and investigating problems myself.

The project went through several iterations after finding issues with synchronization, retries, race conditions, and checkout idempotency.

One of the more useful parts of building this project was testing what happens outside the normal "everything works" scenario — such as losing the internet, retrying requests, having multiple devices update an order, or dealing with a third-party service problem.

It helped me understand that building a web app is not only about making the normal flow work. You also need to think about what happens when things fail.

## Project Status

Sari-Salo is an actively developed **v1 portfolio project**.

The project demonstrates my experience and learning in:

- Building offline-capable web applications
- IndexedDB and local persistence
- Background synchronization
- API idempotency
- Basic conflict resolution
- Retry and error handling
- PostgreSQL and Prisma
- Supabase
- Real-time updates
- Handling concurrent updates
- Debugging third-party service issues
```
