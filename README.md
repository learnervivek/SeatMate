# SeatMate

SeatMate is a passenger seat-swapping platform for people travelling on the same train or flight.
A user verifies a journey with a PNR, states which seat/berth type they'd actually like, and the
app finds other verified passengers on the *same* train/flight, date, and class whose current seat
matches what they want (and vice versa). Either side can send a swap request; the other can accept
or reject it; accepted swaps are recorded in-app and both sides get a real-time notification over
Socket.IO.

> **This is a portfolio/demo project.** PNR verification uses a small in-memory **mock dataset**
> (`server/src/features/pnr/mockPnrData.ts`) — SeatMate is **not** connected to Indian Railways,
> IRCTC, or any airline reservation system. An "accepted" swap only updates SeatMate's own
> database; it does **not** change a real ticket or reservation. See
> [architecture.md](architecture.md#mock-pnr-boundary) for how that boundary is enforced in code.

## 1. Overview

| | |
| --- | --- |
| **Problem** | You've booked a seat you'd rather not have (upper berth, middle seat, wrong coach) but the reservation itself is fixed. Somewhere on the same journey is another passenger with the seat you want, who wants yours. |
| **Solution** | Verify your journey, say what seat you'd actually want, and SeatMate surfaces compatible passengers on that exact train/flight, date, and class. A swap only happens once both sides explicitly agree. |
| **Status** | Feature-complete demo/portfolio build: auth, PNR verification, seat preferences + matching, the full swap request lifecycle, and real-time notifications are all implemented and tested end-to-end. |

## 2. Features

- **Authentication** — email/password registration and login, JWT in an HTTP-only cookie (never
  `localStorage`), session persistence across reloads, protected routes.
- **Journey verification** — enter a PNR, get back the train/flight, route, class, and your
  assigned seat, pulled from a clearly-labeled mock dataset.
- **Interactive seat map** — a realistic Indian train coach (4 bays, lower/middle/upper + side
  berths) or flight cabin layout, distinguishing your seat, available seats, seats held by
  compatible passengers, your selected preference, and unavailable seats.
- **Seat preferences** — state which berth type(s) you'd accept, optionally restrict to your own
  coach or a seat-number range.
- **Matching** — a scored, ranked list of compatible passengers on the same journey, with
  human-readable reasons for each match (mutual want, same coach, seat range fit).
- **Swap requests** — send, accept, reject, or cancel a request; requests expire automatically
  after 3 days; accepting swaps both passengers' seats atomically.
- **Real-time notifications** — a request being sent, accepted, rejected, or cancelled pushes an
  instant Socket.IO event to the other side, backed by a persisted notification so nothing is lost
  if they're offline.
- **Dashboard** — current journey, preference status, compatible-passenger count, pending swap
  activity, and recent notifications in one screen, with realistic empty states throughout.

## 3. Architecture

SeatMate is a two-workspace monorepo: a React/Vite frontend (`client/`) and an Express/TypeScript
API (`server/`), both organized **by feature** (auth, journeys, preferences, swaps, notifications)
rather than by technical layer. The API is stateless aside from MongoDB; Socket.IO runs in the same
process and authenticates over the same JWT cookie as the REST API. There is no Redis, message
queue, or microservice split — see [architecture.md](architecture.md) for the full breakdown,
including the matching algorithm, MongoDB schema/index design, Socket.IO's connection model, and
the concurrency handling behind swap acceptance.

```
SeatMate/
├── client/     # React + Vite frontend
├── server/     # Express + TypeScript API + Socket.IO
├── architecture.md
└── README.md   # you are here
```

## 4. Database schema

Five MongoDB collections (Mongoose schemas, all with `{ timestamps: true }`):

**User**
| Field | Type | Notes |
| --- | --- | --- |
| `name` | string | |
| `email` | string | unique, lowercased |
| `passwordHash` | string | bcrypt, `select: false` — never returned by default |

**Journey** — one per verified PNR
| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId → User | |
| `pnr` | string | unique — claims the PNR to one account |
| `transportType` | `'train' \| 'flight'` | |
| `operatorName`, `vehicleNumber`, `from`, `to`, `boardingStation`, `class` | string | |
| `travelDate` | Date | |
| `assignedSeat` | `{ coach?, seatNumber, berthType }` | mutated in place when a swap completes |
| `status` | `'active' \| 'cancelled'` | |

**SwapPreference** — at most one per journey
| Field | Type | Notes |
| --- | --- | --- |
| `journeyId` | ObjectId → Journey | unique |
| `userId` | ObjectId → User | |
| `currentSeat` | seat snapshot | taken when the preference is set, independent of `Journey.assignedSeat` |
| `desiredBerthTypes` | `BerthType[]` | at least one required |
| `sameCoach` | boolean | |
| `preferredSeatRange` | `{ min, max }` | optional |
| `status` | `'active' \| 'matched' \| 'cancelled'` | |

**SwapRequest** — one per swap attempt
| Field | Type | Notes |
| --- | --- | --- |
| `requesterId`, `receiverId` | ObjectId → User | |
| `requesterJourneyId`, `receiverJourneyId` | ObjectId → Journey | |
| `requesterSeat`, `receiverSeat` | seat snapshots | taken at request-creation time, re-validated at accept time |
| `message` | string | optional, max 280 chars |
| `status` | `pending \| accepted \| rejected \| cancelled \| expired \| completed` | a successful accept jumps straight to `completed` |
| `expiresAt` | Date | 3 days from creation |

**Notification**
| Field | Type | Notes |
| --- | --- | --- |
| `userId` | ObjectId → User | |
| `type` | `swap_request_received \| swap_request_completed \| swap_request_rejected \| swap_request_cancelled` | |
| `title`, `message` | string | |
| `relatedSwapRequestId` | ObjectId → SwapRequest | optional |
| `read` | boolean | |

Full index rationale (which query each index serves) is in
[architecture.md § MongoDB design](architecture.md#3-mongodb-design).

## 5. API documentation

All routes are prefixed `/api`. Except `/auth/register`, `/auth/login`, and `/health`, every route
requires the auth cookie (`requireAuth` middleware) and returns `401` without it.

**Auth**
| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| POST | `/auth/register` | `{ name, email, password }` | Rate-limited. Sets the session cookie. |
| POST | `/auth/login` | `{ email, password }` | Rate-limited. Sets the session cookie. |
| POST | `/auth/logout` | — | Clears the session cookie. |
| GET | `/auth/me` | — | Returns the current user, or `401`. |

**PNR / Journeys**
| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| POST | `/pnr/verify` | `{ pnr }` | Rate-limited. Creates (or idempotently returns) a `Journey`. |
| GET | `/journeys` | — | The caller's active journeys, soonest first. |
| GET | `/journeys/:journeyId` | — | `404` if not owned by the caller. |

**Preferences & matching**
| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| POST | `/preferences` | `{ journeyId, desiredBerthTypes, sameCoach?, preferredSeatRange? }` | Upserts — one preference per journey. |
| GET | `/preferences/:journeyId` | — | `404` if none set, or the journey isn't the caller's. |
| PATCH | `/preferences/:id` | any of the above fields, plus `status` | At least one field required. |
| GET | `/preferences/:journeyId/matches` | — | Runs the matching engine; returns scored, ranked candidates. |

**Swap requests**
| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| POST | `/swaps` | `{ requesterJourneyId, receiverJourneyId, message? }` | Rate-limited. `409` on a duplicate pending request for the same pair. |
| GET | `/swaps/incoming` | — | Requests where the caller is the receiver. |
| GET | `/swaps/outgoing` | — | Requests the caller sent. |
| PATCH | `/swaps/:id/accept` | — | Receiver-only. Runs inside a MongoDB transaction. |
| PATCH | `/swaps/:id/reject` | — | Receiver-only. |
| PATCH | `/swaps/:id/cancel` | — | Requester-only. |

**Notifications**
| Method | Route | Body | Notes |
| --- | --- | --- | --- |
| GET | `/notifications` | — | Most recent 50, plus `unreadCount`. |
| PATCH | `/notifications/:notificationId/read` | — | |
| PATCH | `/notifications/read-all` | — | |

**Health**
| Method | Route | Notes |
| --- | --- | --- |
| GET | `/health` | Unauthenticated; `{ status: 'ok', timestamp }`. |

Every error response is `{ message: string, errors?: {...} }` (validation errors include a
per-field `errors` map); see `server/src/middleware/errorHandler.ts` for the exact mapping from
error type to status code.

## 6. Local setup

### Prerequisites

- Node.js 20+
- A MongoDB instance running as a **replica set** (a free MongoDB Atlas cluster already is one; a
  local `mongod` needs `--replSet <name>` plus a one-time `rs.initiate()` — a single-node replica
  set is enough). This is required because accepting a swap runs inside a MongoDB transaction.

### Steps

1. **Install dependencies** (installs both workspaces from the repo root):

   ```bash
   npm install
   ```

2. **Configure environment variables**:

   ```bash
   cp server/.env.example server/.env
   cp client/.env.example client/.env
   ```

   Edit `server/.env` — at minimum set `MONGODB_URI` to your database and `JWT_SECRET` to a long
   random string. The defaults in `client/.env.example` work as-is for local development.

3. **Run both apps in dev mode**:

   ```bash
   npm run dev
   ```

   This starts the API on `http://localhost:5000` and the client on `http://localhost:5174` (via
   `concurrently`). Or run them separately with `npm run dev:server` / `npm run dev:client`.

4. **Try it out**: register two accounts (e.g. in two browser profiles), and verify PNRs from the
   mock dataset that share the same train/flight, date, and class so they can match each other, for
   example:

   | PNR | Train | Date | Class | Seat |
   | --- | --- | --- | --- | --- |
   | `2458761023` | Rajdhani Express 12301 | 2026-10-05 | 3A | B4/32 (side-upper) |
   | `2458761024` | Rajdhani Express 12301 | 2026-10-05 | 3A | B4/18 (lower) |

   Full list in [server/src/features/pnr/mockPnrData.ts](server/src/features/pnr/mockPnrData.ts).

### Scripts (root)

| Command | Description |
| --- | --- |
| `npm run dev` | Run API + client together |
| `npm run build` | Build both workspaces for production |
| `npm run lint` | Lint both workspaces |
| `npm run test` | Run the server's test suite (Vitest) |
| `npm run format` | Format the repo with Prettier |

Each workspace also exposes its own `dev`, `build`, `lint`, and `typecheck` scripts.

## 7. Environment variables

**`server/.env`** (see `server/.env.example` / `server/.env.production.example`)

| Variable | Description |
| --- | --- |
| `NODE_ENV` | `development` \| `test` \| `production`. Gates secure cookies, Helmet, and test-only rate-limit bypass. |
| `PORT` | API port. |
| `CLIENT_ORIGIN` | The frontend's exact origin — drives CORS and must match for cookies to work. |
| `MONGODB_URI` | MongoDB connection string. Must point at a replica set. |
| `JWT_SECRET` | Signing secret for session JWTs. Long and random in every real environment. |
| `JWT_EXPIRES_IN` | Session lifetime (e.g. `7d`). Also sets the cookie's `maxAge` in lockstep. |
| `COOKIE_NAME` | Name of the session cookie. |
| `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX` | Generic API rate limit (login, registration, and PNR/swap endpoints have their own tighter, hardcoded limits — see `middleware/rateLimiter.ts`). |

**`client/.env`** (see `client/.env.example` / `client/.env.production.example`)

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | The API's base URL, including `/api`. |
| `VITE_SOCKET_URL` | The API's origin for the Socket.IO connection (no `/api` suffix). |

## 8. Testing

The server has a full Vitest suite — unit, integration/API, and real Socket.IO tests — run with
`npm run test -w server` (or `npm run test` from the repo root). No external MongoDB is required:
`globalSetup` boots an in-memory **replica set** (`mongodb-memory-server`'s `MongoMemoryReplSet`,
not a standalone server) once for the whole run, specifically so the swap-accept flow's MongoDB
transaction is exercised for real rather than mocked.

| File | Covers |
| --- | --- |
| `features/auth/auth.service.test.ts` | Registration (password hashing, duplicate email), login (correct/incorrect credentials, user enumeration safety), JWT expiration/forgery. |
| `features/pnr/pnr.service.test.ts` | Mock PNR lookup, journey creation from a PNR, idempotent re-verification, claiming an already-claimed PNR, unknown PNR. |
| `features/preferences/matching.test.ts` | The pure scoring engine — mutual-want bonus, same-coach bonus, seat-range bonus, hard filters. |
| `features/swaps/swap.service.test.ts` | Create/accept/reject/cancel, authorization (only the receiver can accept/reject, only the requester can cancel), an already-completed swap, an expired request, **two users requesting the same passenger** (the loser is auto-cancelled on accept), and **concurrent accept** (fired as two simultaneous calls — exactly one succeeds, seats swap exactly once). |
| `test/api.integration.test.ts` | The same flows over real HTTP (`supertest` against `createApp()`), plus authorization (`404`/`403` on other users' resources), validation (`422`), duplicate requests (`409`), and expired-session handling (`401`). |
| `test/socket.integration.test.ts` | A real `socket.io-client` connected to a real `http.Server` + `initSocketServer(...)`, asserting request/accept/reject each deliver the correct event to the correct user's socket. |

This also covers every edge case the project explicitly calls for: duplicate swap requests, expired
requests, a user attempting to accept their own request, an already-completed swap, an unavailable
(cancelled) journey, an invalid PNR, expired authentication, and concurrent swap acceptance.

The client is verified through `npm run typecheck -w client` and `npm run lint -w client`, plus
manual cross-viewport (mobile/tablet/desktop) and keyboard-navigation passes — there is no
component/E2E test runner configured on the frontend yet (see
[Future improvements](#11-future-improvements)).

## 9. Deployment

SeatMate deploys as two independent pieces — a static frontend build and a Node API — which can
run on the same host behind a reverse proxy or on two separate platforms (e.g. a static host for
`client/dist` and a small VM/PaaS instance for the API):

1. **Database.** Provision a MongoDB replica set (a MongoDB Atlas free/shared cluster already is
   one). Transactions will fail against a standalone `mongod`.
2. **API.** `npm run build -w server` compiles TypeScript to `server/dist`; run it with
   `npm run start -w server` (`node dist/server.js`). Set the environment variables from
   `server/.env.production.example` — a real `MONGODB_URI`, a freshly generated `JWT_SECRET`, and
   `CLIENT_ORIGIN` set to the frontend's real deployed origin (required for CORS and for cookies to
   be accepted cross-site). `NODE_ENV=production` is what turns on `secure` cookies (HTTPS-only) and
   the full Helmet/CORS/rate-limit posture already active in every environment.
3. **Frontend.** `npm run build -w client` produces a static `client/dist` — serve it from any
   static host or CDN. Set `VITE_API_URL`/`VITE_SOCKET_URL` (from
   `client/.env.production.example`) to the deployed API's real origin **before building** — Vite
   inlines these at build time, so changing them requires a rebuild, not just a redeploy.
4. **HTTPS.** Both the API and frontend should be served over HTTPS in production — required for
   `secure` cookies to actually be sent, and for the Socket.IO connection's `withCredentials` to
   work cross-site.

There is no Docker/CI/CD configuration in this repository — see
[Future improvements](#11-future-improvements).

## 10. Limitations

Stated plainly, as a portfolio project should:

- **Mock PNR data only.** There is no integration with Indian Railways, IRCTC, or any airline's
  real reservation system — see the [Mock PNR boundary](architecture.md#mock-pnr-boundary).
- **Application-level swaps only.** Accepting a swap updates SeatMate's own database; it does not
  and cannot modify a real ticket or reservation.
- **Single-process architecture.** No Redis, no horizontal scaling story yet — see
  [architecture.md § Why Redis is not currently used](architecture.md#7-why-redis-is-not-currently-used).
- **No password reset / email verification flow.** Registration and login only; there's no
  transactional email sending configured.
- **No automated frontend tests.** The client is covered by TypeScript + ESLint + manual
  cross-viewport/accessibility review, not an automated component or E2E suite.
- **English-only, no i18n.**
- **No admin/moderation tooling.** There's no way to remove abusive content or ban a user short of
  direct database access.

## 11. Future improvements

- Add a component/E2E test layer for the frontend (Vitest + Testing Library, or Playwright for the
  full swap flow across two simulated users).
- Password reset and email verification (would need a transactional email provider).
- Optional push notifications (web push) for users who've closed the tab.
- Multi-passenger PNRs: currently only the first passenger on a PNR is treated as "the verifying
  user"; co-passengers are read but never modeled as separate journeys.
- Redis-backed Socket.IO adapter and rate-limit store, once/if the backend needs more than one
  instance — see [architecture.md § When Redis would be introduced](architecture.md#8-when-redis-would-be-introduced).
- CI (typecheck/lint/test on every PR) and a Dockerfile for the API.

## License

This is a personal/portfolio project; no license has been chosen yet.
