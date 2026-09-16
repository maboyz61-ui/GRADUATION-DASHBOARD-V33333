# UKZN Photo Platform v3.1 — Production Build Plan

Status: executing. Target: replace the in-memory demo with a production-shaped,
locally-runnable stack, then wire CI/CD and containers.

## 1. Goals and non-goals

### Goals
- Real persistence (SQLite locally, PostgreSQL in production) behind one repository layer.
- Stateless authentication: OIDC SSO + PIN access code, issued as signed JWTs.
- Media storage abstraction: local disk in dev, S3 in production, with signed URLs.
- Payment integration: PayFast signature generation and ITN webhook verification.
- Input validation, central error handling, structured request logging.
- Automated tests for auth, identifier, orders, payments.
- Reproducible builds: Docker images, compose for the full stack, nginx reverse proxy.
- CI pipeline that lints, tests, and builds both apps.

### Non-goals (this iteration)
- Real UKZN OIDC tenant onboarding (adapter is pluggable, stub issuer retained).
- Real PayFast merchant credentials (sandbox config + signature logic only).
- Horizontal scaling / multi-region. Single-node compose is the deployment target.

## 2. Target architecture

```
                         ┌─────────────────────────┐
   browser  ──HTTPS──▶   │  nginx  (TLS, /api proxy)│
                         └────────────┬────────────┘
                                      │
                     ┌────────────────┴────────────────┐
                     │                                 │
             ┌───────▼────────┐               ┌────────▼────────┐
             │  frontend       │               │  api            │
             │  nginx: static  │               │  node/express   │
             │  vite dist      │               │  :3001          │
             └─────────────────┘               └───┬─────────┬───┘
                                                  │         │
                                        ┌─────────▼──┐  ┌───▼─────────┐
                                        │ PostgreSQL │  │ S3 / disk   │
                                        └────────────┘  └─────────────┘
```

### Backend module layout
```
backend/
  server.js                 # thin entry → src/app.js
  src/
    config.js               # env parsing + validation, single source of truth
    app.js                  # express app assembly (no listen)
    lib/
      logger.js             # structured JSON logger
      jwt.js                # HS256 sign/verify on node:crypto
      crypto.js             # scrypt PIN hashing, timing-safe compare
      errors.js             # AppError + typed factories
    db/
      index.js              # adapter factory (sqlite | postgres)
      sqlite.js             # node:sqlite driver
      postgres.js           # pg driver
      schema.sql            # canonical DDL
      migrate.js            # applies schema + migrations table
      seed.js               # idempotent demo data
    repositories/
      userRepo.js
      photoRepo.js
      eventRepo.js
      frameRepo.js
      orderRepo.js
    services/
      authService.js        # OIDC + PIN → token
      orderService.js       # totals recomputed server-side
      storage.js            # local | s3 adapter
      payfast.js            # signature + ITN validation
    middleware/
      auth.js               # requireAuth / requireAdmin
      validate.js           # zod-style schema validation
      error.js              # terminal error handler
      requestId.js
    routes/
      auth.js  photos.js  events.js  frames.js
      orders.js  identifier.js  admin.js  media.js  health.js
  test/                     # node:test
```

## 3. Phases, deliverables, acceptance criteria

### Phase 1 — Persistence + auth foundation
Deliverables
- `config.js` validating required env in production (`JWT_SECRET`, `DATABASE_URL`).
- DB adapter with `sqlite` (dev/test) and `postgres` (prod) drivers.
- DDL for users, photos, events, frames(textures/mats/overlays/sizes), orders, order_items, access_codes.
- Repositories that keep the existing JSON response shapes.
- JWT auth (HS256) replacing the in-memory `sessions` map.
- PIN login: 6-digit codes hashed with scrypt, single-use, expiring.
- Validation + centralized errors with stable `{ error, code }` bodies.

Acceptance
- `npm test` passes auth, identifier, order-total, and payment-signature suites.
- Restarting the API preserves users, photos, and orders.
- No route trusts client-supplied totals.

### Phase 2 — Media storage
Deliverables
- `storage.js` with `local` and `s3` drivers behind one interface.
- Upload → object key `events/{eventId}/{identifier}/{photoId}.jpg`.
- `GET /api/v1/media/:id/url` returns a short-lived signed URL.
- `GET /media/*` static fallback in dev.

Acceptance
- Uploading a photo in dev writes to disk and returns a servable URL.
- S3 driver is selected purely by `STORAGE_DRIVER=s3`, no code change.

### Phase 3 — Payments
Deliverables
- `payfast.js` builds the signature from ordered fields per PayFast spec.
- `POST /api/v1/payments/payfast/itn` verifies signature, validates amount against
  the stored order, and transitions status `pending → paid | failed`.
- Checkout returns a redirect form payload instead of instantly marking paid.

Acceptance
- Tampered ITN signature is rejected with 400.
- Amount mismatch is rejected and logged.
- Order status transitions are idempotent.

### Phase 4 — Frontend production readiness
Deliverables
- `VITE_API_BASE` support so the SPA can target a non-proxied API origin.
- Shared fetch client with auth header injection and 401 handling.
- React error boundary and route-level suspense fallback.
- `npm run build` produces a static `dist/` with no dev-only imports.

Acceptance
- `npm run build` succeeds; `dist/` served by nginx works against the API.
- Expired token redirects to the PIN screen instead of a blank page.

### Phase 5 — Packaging, deploy, CI
Deliverables
- Multi-stage `Dockerfile` for API and for the frontend (nginx).
- `docker-compose.yml`: postgres + api + web + (optional) minio.
- `.env.example` documenting every variable.
- GitHub Actions: install → test → build → push images (on tag).
- `start.sh` retained for the zero-dependency local demo.

Acceptance
- `docker compose up --build` serves the app end to end.
- CI is green on the main branch.

## 4. Environment matrix

| Variable | Dev default | Production | Notes |
|---|---|---|---|
| `NODE_ENV` | development | production | gates strict config checks |
| `PORT` | 3001 | 3001 | API listen port |
| `DATABASE_DRIVER` | sqlite | postgres | adapter selector |
| `DATABASE_URL` | ./data/dev.db | postgres://... | sqlite path or PG URL |
| `JWT_SECRET` | dev-insecure | required 32+ chars | startup fails if weak in prod |
| `JWT_EXPIRES_IN` | 12h | 1h | access token TTL |
| `STORAGE_DRIVER` | local | s3 | media backend |
| `S3_BUCKET` / `S3_REGION` | — | required | when driver=s3 |
| `PAYFAST_MERCHANT_ID` / `PAYFAST_MERCHANT_KEY` | sandbox | required | signature |
| `PAYFAST_PASSPHRASE` | — | required | salt for signature |
| `PAYFAST_SANDBOX` | true | false | endpoint switch |
| `CORS_ORIGIN` | * | exact origin | locked in prod |
| `VITE_API_BASE` | (proxy) | https://host/api | frontend build arg |

## 5. Testing strategy

- **Unit**: signature builder, JWT round-trip, scrypt verify, total recomputation.
- **Integration**: supertest-style calls against the express app with a temp SQLite DB.
- **Contract**: response shape snapshots to protect the frontend.
- Runner: `node:test` (zero dependency). Command: `npm test` in `backend/`.

## 6. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| `node:sqlite` is experimental | dev-only breakage | adapter isolates it; PG is the prod path |
| PayFast signature drift | failed payments | unit-test the exact field order + passphrase rules |
| Client-supplied totals | revenue loss | server always recomputes from the frame catalog |
| Token leakage | account takeover | short TTL, HTTPS only, no token in URLs |
| S3 credential scope | data exposure | least-privilege bucket policy, signed URLs only |

## 7. Execution log

- [x] Phase 0: repo assessment (node 22.22, node:sqlite available, vite + express present)
- [ ] Phase 1: persistence + auth foundation
- [ ] Phase 2: media storage
- [ ] Phase 3: payments
- [ ] Phase 4: frontend production readiness
- [ ] Phase 5: packaging, deploy, CI
