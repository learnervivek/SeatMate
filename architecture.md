# SeatMate — Architecture

This document describes how SeatMate is put together and why. It assumes the reader has read the
[README](README.md) for the product-level overview; this is the engineering-level one.

## Goals behind the structure

- **Feature-oriented, not layer-oriented.** Both `client/src/features/*` and
  `server/src/features/*` group everything about one domain concept (model, validation, service,
  controller/routes, UI) together, instead of spreading it across global `controllers/`,
  `models/`, `routes/` folders. Adding or removing a feature touches one directory.
- **Thin controllers, real services.** Route handlers only parse the request and shape the
  response; all business logic (matching, swap acceptance, seat mutation) lives in `*.service.ts`
  functions that are independently testable and have no Express types in their signatures.
- **Validate at the boundary.** Every mutating route runs its `req.body`/`req.params` through a
  Zod schema before a controller ever sees it (`middleware/validate.ts`). The same *shape* of Zod
  schema (mirrored, not shared, between client and server) drives React Hook Form validation
  client-side.
- **No premature infrastructure.** No Redis, no message queue, no microservices. Matching is a
  handful of Mongo queries over a few thousand rows at most — this is a demo, not a scaled system.
  See [Why Redis is not currently used](#why-redis-is-not-currently-used) below.

---

## 1. Frontend architecture

```
client/src/
├── app/              # App.tsx (routes + auth bootstrap), ProtectedRoute
├── components/
│   ├── layout/         # Navbar, BottomNav (mobile), AppLayout (shell around <Outlet/>)
│   └── ui/               # Presentational primitives: Button, Card, Badge, Input, Select, Modal,
│                           Toast, Skeleton, EmptyState, ErrorState, LoadingState, Spinner,
│                           SeatMap/CoachLayout/Seat/SeatLegend (the seat visualization)
├── design-system/      # tokens.ts — raw color/spacing/radius values mirrored from tailwind.config.ts
├── features/
│   ├── auth/             # api.ts, Zod schemas, LoginPage, RegisterPage
│   ├── dashboard/           # DashboardPage — the authenticated landing screen
│   ├── journeys/               # api.ts, VerifyPnrForm, JourneyCard, JourneyPage, useCurrentJourney
│   ├── pnr/                      # api.ts only (PNR verification is invoked from journeys/)
│   ├── preferences/                # api.ts, PreferenceForm (the interactive seat-preference map), PreferencesPage
│   ├── swaps/                        # api.ts, MatchCard, MatchesList, MatchesPage, SwapRequestCard,
│   │                                    SwapRequestsPage, swapStatus.ts (status → label/tone mapping)
│   ├── notifications/                  # api.ts, NotificationBell, NotificationsPage, useSocketNotifications
│   ├── profile/                          # ProfilePage
│   └── landing/                            # LandingPage, SeatSwapDiagram (marketing page, anonymous users)
├── lib/                # apiClient (Axios instance + 401 interceptor), socketClient (Socket.IO singleton)
├── store/                # Zustand: authStore, notificationStore, toastStore
└── types/                  # domain.ts — TypeScript types mirroring the API's response shapes
```

**State.** Zustand holds the two pieces of state genuinely global to the app: the current user
(`authStore`) and the live notification feed (`notificationStore`), plus a small `toastStore` for
transient UI feedback. Everything else — a journey's matches, a form's fields, a modal's open state
— is local `useState` in the component that owns it. No global store holds server data that only
one screen needs.

**Data fetching.** Plain `async`/`await` through small `api.ts` modules per feature, wrapping a
shared `axios` instance (`lib/apiClient.ts`, `withCredentials: true` so the auth cookie rides along
automatically). There is no React Query/SWR layer — the app's read patterns are simple enough
(load-on-mount, refetch-after-mutation) that a cache library would add complexity without payoff at
this scale. `useCurrentJourney` is the one small custom hook that wraps this pattern (cancellable
fetch, `refetch()`), because it's reused across the dashboard and journey pages.

**Forms.** React Hook Form + `@hookform/resolvers/zod` for the auth forms, validated against the
same shape of Zod schema the server enforces. Simpler forms (PNR entry, the seat-preference toggle)
use local `useState` directly rather than pulling in the form library for one or two fields.

**Auth bootstrap.** On mount, `App.tsx` calls `GET /api/auth/me`; success populates `authStore`,
failure marks `unauthenticated`. `ProtectedRoute` shows a loading state and redirects to `/login`
until that resolves — there's no flash of protected content before the check completes.

**Real-time.** `useSocketNotifications` connects the Socket.IO client once a user id is present,
seeds `notificationStore` from `GET /api/notifications`, and appends any `notification:new` event
pushed from the server. See [Socket.IO architecture](#4-socketio-architecture) for the full flow.

**Code splitting.** Every route except the public landing page is lazy-loaded
(`React.lazy` + a single `<Suspense>` boundary in `App.tsx`) — an anonymous visitor's first load
only pays for the marketing page, not the seat map, matching UI, and every authenticated form. This
cut the initial JS bundle from ~406 KB to ~282 KB (measured via `npm run build -w client`), with the
rest split into small per-route chunks (1–8 KB each) fetched on demand.

**Design system.** Tailwind config (`client/tailwind.config.ts`) is the source of truth for the
editorial transportation palette (charcoal `ink`, warm ivory `stone`, `terracotta` accent, muted
`sage`/`rust`/`amber` status colors) and the restrained shadow/radius scale. `design-system/tokens.ts`
mirrors the same values as plain JS/TS constants for the rare case (inline SVG, etc.) that needs a
raw value instead of a utility class.

---

## 2. Backend architecture

```
server/src/
├── config/          # env parsing (Zod-validated), MongoDB connection
├── features/
│   ├── auth/          # register/login/logout/me — issues JWT, sets HTTP-only cookie
│   ├── users/            # User model + a toPublicUser DTO (never leaks passwordHash)
│   ├── journeys/            # PNR verification against the mock dataset, journey read APIs
│   ├── pnr/                    # PNRService abstraction + mock provider (see mock PNR boundary, below)
│   ├── preferences/               # SwapPreference model + CRUD API + the isolated matching engine
│   ├── swaps/                        # SwapRequest lifecycle (pending/accepted/rejected/cancelled/expired)
│   └── notifications/                   # persisted Notification model + Socket.IO emit
├── middleware/        # requireAuth, validate, rateLimiter, errorHandler
├── lib/                  # jwt, logger, AppError hierarchy, asyncHandler
├── sockets/                # Socket.IO server: cookie-based handshake auth, per-user rooms
├── test/                     # Vitest globalSetup (in-memory Mongo replica set), db/factory/http helpers
├── types/                      # domain enums shared conceptually with the client, Express Request augmentation
├── app.ts                        # Express app wiring (helmet, cors, rate limits, routes, error handler)
└── server.ts                       # boots the Mongo connection, HTTP server, Socket.IO, graceful shutdown
```

### Why some features import from others

`preferences` imports `getOwnedJourneyOrThrow` from `journeys` (a preference only makes sense for a
journey you own), and `swaps` imports from both `preferences` and `journeys` (accepting a swap reads
the requester's preference and mutates two journeys' `assignedSeat`). This is intentional coupling
along real domain relationships, not a layering violation. What a feature does **not** do is reach
into another feature's Mongoose schema directly — it always goes through that feature's exported
service functions.

### Auth

- Passwords hashed with bcrypt (12 rounds in the running app; test factories use a low cost factor
  purely for speed), never returned by any endpoint (`select: false` on the schema field, re-selected
  explicitly only where the hash itself needs comparing).
- On login/register, a JWT (`{ sub, email }`) is signed and set as an **HTTP-only, `sameSite=lax`**
  cookie (`secure` in production) — never exposed to client-side JS, which is why the client never
  stores a token itself and instead calls `GET /api/auth/me` on load to restore session state.
- `requireAuth` middleware reads that cookie, verifies the JWT, and attaches `req.user`; a
  missing/invalid/expired token returns `401` uniformly, and the frontend's Axios interceptor
  redirects to `/login?expired=1` on any `401` seen while `authStore` still thinks it's authenticated.

### Mock PNR boundary

PNR verification lives behind a `PNRService` interface (`features/pnr/pnrService.ts`) with a single
method, `lookup(pnr)`. The only implementation today is `MockPNRService`, backed by a static,
hard-coded array of demo PNR → journey records in `features/pnr/mockPnrData.ts`, clearly commented
as demo-only — there is no HTTP call to any external railway/airline API anywhere in the codebase.
`journey.service.verifyPnrForUser` (called from `POST /api/pnr/verify`) depends only on that
interface, not on the mock data directly, so a real provider could be swapped in later by writing a
new class and changing one export — no controller, service caller, or frontend code would need to
change. It also only persists the subset of the PNR lookup result the app actually needs (route,
date, class, and the verifying passenger's own seat) — passenger name/age and any co-passengers on
the PNR are read but never stored. A PNR is claimed by whichever account verifies it first (`unique`
index on `Journey.pnr`); verifying someone else's already-claimed PNR returns a `409`, not a live
"reservation" of any kind. When a swap is accepted, `swap.service.acceptSwapRequest` swaps the two
`Journey.assignedSeat` subdocuments — this is explicitly an **application-level record**, not a
write to any external reservation system. This boundary is called out in the code comment right
above that swap, in the README, and here, so it can't be read as more than it is.

---

## 3. MongoDB design

Five collections, one per feature model: `User`, `Journey`, `SwapPreference`, `SwapRequest`,
`Notification`. All use Mongoose schemas with `{ timestamps: true }`; there is no schema-less/`Mixed`
data anywhere.

| Collection | Key fields | Notes |
| --- | --- | --- |
| `User` | `name`, `email` (unique), `passwordHash` (`select: false`) | Never returns the hash; `toPublicUser()` DTO strips it at the boundary regardless. |
| `Journey` | `userId`, `pnr` (unique), `transportType`, `vehicleNumber`, `travelDate`, `class`, `assignedSeat` (embedded), `status` | One document per verified PNR. `assignedSeat` is mutated in place when a swap completes — it is the seat's live state, not a log. |
| `SwapPreference` | `journeyId` (unique — one preference per journey), `userId`, `currentSeat` snapshot, `desiredBerthTypes[]`, `sameCoach`, `status` | `currentSeat` is deliberately a separate snapshot from `Journey.assignedSeat` so a preference stays historically legible even after a swap changes the journey's real seat. |
| `SwapRequest` | `requesterId`, `receiverId`, `requesterJourneyId`, `receiverJourneyId`, `requesterSeat`/`receiverSeat` snapshots, `status`, `expiresAt` | Flat document, no sub-collection of "responses" — a request has exactly one lifecycle. |
| `Notification` | `userId`, `type`, `title`, `message`, `relatedSwapRequestId`, `read` | Capped to the 50 most recent per user at read time (`listNotificationsForUser`), not by a TTL — old notifications aren't deleted, just not returned past that limit. |

### Indexes

Every index below maps to a real, specific query in the codebase — none were added speculatively:

- **`User.email`** — `unique` (login/registration lookup and the constraint itself).
- **`Journey.pnr`** — `unique` (claims a PNR to exactly one account; the source of the `409` on a
  second verification attempt).
- **`Journey { vehicleNumber, travelDate, class, status }`** — matches
  `matching.service.ts`'s candidate-journey query exactly (all four are equality filters), so it's
  answered entirely from the index.
- **`Journey { userId, status, travelDate }`** — covers `listJourneysForUser`'s filter *and* its
  `sort({ travelDate: 1 })`, so Mongo returns pre-sorted results with no in-memory sort. Its prefix
  (`userId`) also serves the plain by-owner lookups elsewhere, which is why there's no separate
  single-field index on `Journey.userId`.
- **`SwapPreference.journeyId`** — `unique` (one active preference per journey; also the fast path
  for every "does this journey have a preference" check).
- **`SwapPreference { status, journeyId }`** — serves `matching.service.ts`'s
  "which candidate journeys have an *active* preference" query.
- **`SwapRequest { requesterJourneyId, receiverJourneyId, status }`** — `unique`, **partial**
  (`status: 'pending'` only). This is the database-level backstop against a duplicate pending
  request for the same journey pair — the service layer checks this too, but check-then-insert has
  a race window under concurrent requests that only a DB constraint closes. Scoped to `pending` so
  the same two journeys are free to swap again later via a fresh request once one resolves.
- **`SwapRequest { requesterId, status }` / `{ receiverId, status }` /
  `{ requesterJourneyId, status }` / `{ receiverJourneyId, status }`** — the lazy-expiry sweep
  (`expireStaleRequestsMatching`) and the "any other pending request on this journey" lookup run on
  accept both filter on exactly these pairs.
- **`SwapRequest { receiverId, createdAt: -1 }` / `{ requesterId, createdAt: -1 }`** — `GET
  /api/swaps/incoming` and `/outgoing` filter on one id (no status filter — every status is shown)
  and sort by `createdAt` descending; these let that sort come straight off the index on every
  dashboard load instead of an in-memory sort.
- **`Notification { userId, createdAt: -1 }`** — `listNotificationsForUser`'s exact filter+sort.
- **`Notification { userId, read }`** — `getUnreadCount` (the navbar badge) and
  `markAllNotificationsRead`.

No collection here is large enough at demo scale for these to matter for raw speed — they're
included because they're the *correct* indexes for the access patterns above, and because
demonstrating that reasoning is part of the point of a portfolio project like this one.

---

## 4. Socket.IO architecture

Flow for every notification-worthy event (a swap request being sent, accepted/completed, rejected,
or cancelled):

```
User action (e.g. accept a swap)
  → swap.service.* mutates MongoDB (the swap request, journeys, preferences)
  → createNotification(...)
      1. persists a Notification document   ← MongoDB is the source of truth
      2. emits it over Socket.IO to room "user:<id>"
  → Socket.IO client (connected, authenticated, joined its own room)
      → useSocketNotifications appends it to the Zustand notificationStore
      → NotificationBell in the navbar re-renders with the new unread count
```

`createNotification()` (`notifications/notification.service.ts`) always does both steps, in that
order — it **never** emits without first writing to MongoDB. Socket.IO is a live-update channel on
top of that data, never a second source of truth for it.

**Connection and auth.** The Socket.IO server (`sockets/index.ts`) authenticates each connection
during the handshake using an `io.use()` middleware that parses the same HTTP-only JWT cookie the
REST API uses (`cookie.parse(socket.handshake.headers.cookie)`, then `verifyAccessToken`) — there's
no separate socket token to issue or manage, and a connection with no/invalid cookie is rejected
before `connection` fires. On success, the socket joins a room scoped to that user's id
(`user:<userId>`), so `emitToUser(userId, event, payload)` — a single `io.to(room).emit(...)` call —
can only ever reach that user's own connections, including multiple tabs/devices at once.
`disconnect` is logged with its reason (`transport close`, `ping timeout`, `client namespace
disconnect`, etc.); no server-side per-connection state needs manual cleanup beyond that, since room
membership is torn down automatically by Socket.IO.

**Reconnects.** Because the handshake middleware re-runs on *every* connection attempt, an automatic
reconnect (network blip, laptop sleep, a server restart) re-authenticates itself the exact same way —
nothing socket-specific to reconnect "as" survives or needs restoring. The client
(`useSocketNotifications`) treats the socket purely as a live-update channel on top of data it always
keeps synced from the REST API: it listens for the client's own `connect` event (which fires on the
*first* connect and again after *every* reconnect) and re-fetches `GET /api/notifications` each time,
so anything emitted while disconnected — which the socket itself has no memory of, by design — is
simply picked up from MongoDB once the connection is back. `connect_error` is handled by doing
nothing beyond letting `socket.io-client`'s built-in exponential-backoff retry keep trying; the UI
never treats a dropped socket as an error state, because the REST API remains fully usable the whole
time.

**Tested with a real client.** `server/src/test/socket.integration.test.ts` spins up a real
`http.Server` + `initSocketServer(...)`, connects with an actual `socket.io-client` authenticated via
a cookie obtained from a real `POST /api/auth/register`, and asserts that a request/accept/reject
each deliver the right `notification:new` payload to the right user's socket — not a mock of the
Socket.IO API, the real library on both ends.

---

## 5. Matching algorithm

Split into two layers, deliberately:

- **`preferences/matching.ts`** — pure functions (`evaluateMatch`, `rankMatches`) with no database
  access and no Express types. They take plain `MatchCandidateInput` objects in and return scored
  `MatchResult`s out, which is what makes them unit-testable in isolation
  (`preferences/matching.test.ts`) and safe to improve later without touching a controller, route,
  or the DB layer.
- **`preferences/matching.service.ts`** — the only piece that talks to Mongo. It loads the caller's
  own `SwapPreference`, queries other **active** journeys sharing the same `transportType`,
  `vehicleNumber`, `travelDate`, and `class`, keeps only those whose owner also has an **active**
  preference of their own (a seat only counts as "available for swapping" if someone has actually
  opted in), builds `MatchCandidateInput`s from that, and hands them to `rankMatches`.

`evaluateMatch(self, candidate)` returns `null` (hard filter) when the candidate doesn't hold a berth
type `self` wants, or when `self.sameCoach` is set and the candidate is in a different coach.
Otherwise it returns a `MatchResult` with a 0–100 `score` built from four signals:

| Signal | Points | Why |
| --- | --- | --- |
| Candidate holds a berth type you want | `BASE_SCORE` (40) | The hard requirement — this is what makes it a candidate at all. |
| Candidate *also* wants your berth type back | `MUTUAL_BONUS` (35) | The strongest signal — genuine two-way compatibility, not just a one-sided wish. |
| Same coach | `SAME_COACH_BONUS` (15) | Convenience signal — travelling companions, families, etc. often want to stay in one coach. |
| Candidate's seat number falls in your `preferredSeatRange` | `SEAT_RANGE_BONUS` (10) | A finer-grained preference than berth type alone (e.g. "anywhere in seats 40–60"). |

Scores are capped at `MAX_SCORE` (100) and paired with a human-readable `reasons` list built from
whichever of the above actually applied, so the frontend can show *why* a match was suggested, not
just a number.

The engine only ever *ranks* candidates — nothing here creates, accepts, or otherwise acts on a swap;
see [Concurrency considerations](#6-concurrency-considerations) for the only path that mutates a
seat. This runs as plain Mongo queries (`find` + an in-memory `Map` join) feeding a pure in-memory
scorer, which is more than adequate at demo scale — see
[When Redis would be introduced](#8-when-redis-would-be-introduced) for how this would change under
load.

---

## 6. Concurrency considerations

The one place SeatMate's data can genuinely race is **two people accepting/creating swap requests
that touch the same seat at close to the same time** — everything else (reading matches, sending a
request, rejecting/cancelling) only ever mutates documents scoped to the acting user, so there's
nothing to race.

**Duplicate swap requests.** `createSwapRequest` checks for an existing pending request between the
same journey pair before inserting — but that check-then-insert has a race window under truly
concurrent requests. The real guard is a **partial unique index**
(`SwapRequest { requesterJourneyId, receiverJourneyId, status: 'pending' }`), enforced by MongoDB
itself: a second concurrent insert for the same pair fails at the database regardless of what the
application-level check saw. (See `swap.service.test.ts`'s "rejects a duplicate pending swap
request" case, and the API integration test for the same scenario over HTTP.)

**Concurrent accept.** `acceptSwapRequest` is the one operation that mutates two `Journey` documents
and a `SwapRequest` together, so it runs inside a real **MongoDB transaction**
(`mongoose.startSession()` + `session.withTransaction()`):

1. Before opening the transaction, it re-checks the request is still `pending` (closes the common
   case cheaply, without ever opening a session for an already-resolved request).
2. **Inside** the transaction, it re-fetches the request *again*, under that session's snapshot, and
   re-checks `status === 'pending'`. Two concurrent `acceptSwapRequest` calls on the same request can
   both pass the outer check before either commits — this inner re-check, scoped to the transaction,
   is what actually closes that window, rather than relying only on a write conflict to
   incidentally catch it.
3. It also re-validates that both journeys' **current** `assignedSeat` still match the snapshot taken
   when the request was created — a seat can have changed since via a *different* accepted swap even
   if this exact request is still `pending`. A mismatch aborts the transaction with a `409`.
4. Only after all of that does it swap `assignedSeat` on both journeys, mark both `SwapPreference`s
   `matched`, mark this request `completed`, and cancel any *other* pending requests referencing
   either journey (e.g. a second passenger who'd also requested the seat that just got taken) — all
   inside the same transaction, so the whole set either commits together or not at all.

`swap.service.test.ts` has a dedicated test that fires two concurrent `acceptSwapRequest` calls at
the same pending request and asserts exactly one succeeds, the seats end up swapped exactly once
(not swapped twice, which would silently revert them), and the request lands on `completed` — against
a real MongoDB replica set (`mongodb-memory-server`'s `MongoMemoryReplSet`), not a mock of
transaction semantics.

**Why a replica set, even locally/in tests.** Multi-document transactions require one — a standalone
`mongod` cannot run `session.withTransaction()` at all. This is why local development's
`MONGODB_URI` needs a replica set (a single-node one is enough — see the README) and why the test
suite boots an in-memory `MongoMemoryReplSet` rather than a plain `MongoMemoryServer`.

**Expiry is lazy, not a background job.** A `pending` request past its `expiresAt` (3 days) isn't
flipped to `expired` by a cron/queue — there's no scheduler in this architecture to run one. Instead,
`expireIfNeeded` checks and flips it inline the moment anyone tries to accept/reject it, and
`expireStaleRequestsMatching` sweeps a user's own stale requests to `expired` right before listing
their incoming/outgoing requests, so a client never sees a still-`pending`, actually-expired request
with live Accept/Decline buttons.

---

## 7. Why Redis is not currently used

**Not needed today** because the backend runs as a single Node process. Every piece of state a
multi-instance deployment would need to share — Socket.IO's room membership, `express-rate-limit`'s
request counters — currently lives in that one process's memory, and since there's only one process,
"shared across instances" and "local to this instance" are the same thing. There's no second
instance for state to be out of sync with. Introducing Redis now would add an operational dependency
(a service to run, monitor, and keep available) with no corresponding correctness or scaling benefit
yet — exactly the "premature infrastructure" this project deliberately avoids (see
[Goals behind the structure](#goals-behind-the-structure)).

## 8. When Redis would be introduced

**The moment the backend is horizontally scaled** — two or more instances behind a load balancer, or
serverless/autoscaled containers — for three specific, concrete reasons:

- **Socket.IO cross-instance delivery.** If user A's browser is connected to instance 1 and user B's
  to instance 2, an event emitted by code running on instance 1 (e.g. instance 1 handles B's
  `PATCH /api/swaps/:id/accept` and needs to notify A) has no way to reach a socket that only
  instance 2 holds in memory — `io.to(room).emit(...)` only sees sockets connected to *that*
  process. `@socket.io/redis-adapter` fixes this: each instance publishes to a shared Redis pub/sub
  channel instead of only broadcasting locally, and every instance subscribes, so a room emit
  reaches the right socket regardless of which instance holds the connection. This is the actual
  trigger condition — the current in-memory adapter used by `initSocketServer` silently stops
  working correctly (some users just stop getting real-time notifications, with no error to point
  at it) the moment a second instance joins, which is why it's called out explicitly here.
- **Rate limiting.** `express-rate-limit`'s default in-memory store counts requests per-process; two
  instances would each allow the configured limit independently, doubling (or worse) the effective
  limit and defeating the point. A `rate-limit-redis` store shares counters across instances behind
  the same middleware, with no route code changes.
- **Match/session caching.** `matching.service.findMatchesForJourney` could cache per-(train, date,
  class) query results — not needed at demo scale, but if added, an in-memory cache would go stale
  differently on each instance; Redis gives one shared, consistently-invalidated cache.

None of this needs deciding now — it's flagged here so the decision point ("we're adding a second
instance") is also the trigger for introducing Redis, not something discovered after users start
silently missing notifications.

---

## Request lifecycle example: sending and accepting a swap

1. User A verifies a PNR → `Journey` created, owned by A.
2. User A sets a seat preference on that journey (`POST /api/preferences`).
3. User A opens the journey page → `GET /api/preferences/:journeyId/matches` runs the matching
   engine, returning scored candidates from other users whose current seat fits A's preference.
4. User A clicks "Request swap" on a match → `POST /api/swaps` creates a `pending` `SwapRequest` and
   a `Notification` for the seat's owner (User B), pushed instantly over Socket.IO if B is online.
5. User B opens "Swap requests" → sees the pending request, clicks Accept →
   `PATCH /api/swaps/:id/accept`.
6. Inside a MongoDB transaction, the server re-validates both seats are still what they were when the
   request was created, swaps `assignedSeat` on both journeys, marks the request `completed`, cancels
   any other now-stale pending requests touching either seat, and (once the transaction commits)
   notifies A.
7. Both users now see their updated seat on their journey page — an **application-level** record of
   the agreed swap, not a change to any real train/flight reservation.
