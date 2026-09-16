# UKZN Graduation Photo Portal — Product & Technical Specification

| Field | Value |
| --- | --- |
| Product | UKZN Secure Graduation Photo Portal |
| Version | 3.1.0 (spec revision A) |
| Status | Approved for build |
| Audience | Product, UX/Design, Backend, Frontend, QA, Ops |
| Companion docs | `BUILD_PLAN.md`, `backend/src/db/schema.sql`, `/workspace/.env.example` |
| Traceability note | Sections marked **[shipped]** already exist in this repository. Sections marked **[gap]** are specified here and still to build. |

---

## 0. How to read this document

The prompt asked for one artifact a designer and an engineering team can start from on day one. This document is that artifact, but it is written against a real codebase, so it does two jobs:

1. It specifies the target product end to end (flows, API, schema, wireframes, tests, sprint plan).
2. It states plainly which parts are already implemented so the team does not rebuild them.

The single most important reconciliation: the prompt describes an **album + per-student passcode** model, while the shipped code uses an **event + 6-digit code → JWT** model. Both are specified below; section 21 provides the mapping and a recommendation. Everything else (storage, pricing, PayFast, RBAC) is already live.

---

## 1. Summary / Goal

A secure portal where UKZN graduation photographs can be discovered, unlocked privately, personalised, framed, purchased, printed and shipped — without ever exposing one student's images to another.

**Primary goal.** A graduate finds the ceremony card matching the day their photos were taken, enters a private passcode, and lands in a private dashboard containing only their images. From there they edit, frame, add to cart and check out. The item is printed, framed and shipped.

**Secondary goal.** Administrators can create albums, bulk-upload photographs, assign passcodes, and drive orders through fulfilment.

**Non-goals (v3.1).** Video, social sharing, multi-currency, AI retouching, mobile native apps, print-vendor API integrations (manual fulfilment export only).

**Success metrics.**

| Metric | Target | Instrumentation |
| --- | --- | --- |
| Landing → passcode entry | ≥ 35% | `album_card_click` / page view |
| Passcode success rate | ≥ 92% | `passcode_attempt` |
| Authenticated → add to cart | ≥ 18% | `add_to_cart` / `dashboard_open` |
| Checkout completion | ≥ 60% | `checkout_complete` / `checkout_start` |
| Paid order → shipped ≤ 7 working days | ≥ 95% | order status timestamps |
| Passcode brute-force success | 0 | rate-limit + audit log |

---

## 2. Personas & Roles

| Role | Description | Can do | Cannot do |
| --- | --- | --- | --- |
| Visitor | Anyone, unauthenticated | Browse ceremony cards, search/filter by university/date/location, request passcode help | View images, prices per-image |
| Student / Graduate | Holds a valid passcode for one album | View, edit, frame, buy **their own** images; see own orders; delete own data | See other students' images, admin data |
| Photographer (optional v3.2) | Not in v3.1 scope | — | — |
| Fulfilment Operator | Admin sub-role | View order queue, change status, export print manifests | Manage passcodes, refunds |
| Administrator | UKZN Communications | Everything in admin: albums, uploads, passcodes, moderation, pricing catalog, users, reports | — |

**Authorization model.** Role-based access control (RBAC) with resource ownership checks. Every image request resolves to a `student_id`; non-admins may only read rows where `student_id = token.sub`. Admin routes require `role = admin`. **[shipped]** (`backend/src/middleware/auth.js`, `requireAdmin`).

---

## 3. User Flows

### 3.1 Public landing → album card

1. Visitor lands on `/`. Server returns active albums sorted by `event_date DESC`.
2. Cards render in a responsive grid (1/2/3 columns at 390 / 768 / 1280 px).
3. Visitor filters by university, date range, or location; search is debounced 250 ms.
4. Clicking a card fires `album_card_click` and opens the passcode modal (no navigation, modal keeps album list in the DOM for back-button and focus restoration).

**States:** loading (skeleton cards) · empty ("No ceremonies published yet") · error (retry banner) · filtered-empty ("No ceremonies match those filters — clear filters").

### 3.2 Passcode entry

1. Modal title: **"Enter your private passcode"**. Single 6-character input, auto-uppercase, submit enabled at 6 chars.
2. `POST /albums/:albumId/authenticate`. Server validates against `passcodes.passcode_hash` scoped to that album.
3. Success → server returns a short-lived JWT (`sub`, `albumId`, `role: student`, 12 h). Client stores in `localStorage` and navigates to `/album/:albumId`.
4. Failure → generic **"That passcode did not match"** (never reveal whether the code exists). Attempt counter increments server-side.
5. After 5 failed attempts in 15 minutes → require CAPTCHA. After 10 → 429 with `Retry-After` for 30 minutes, and an `admin_alert` audit row.
6. **"Need help?"** link → recovery page: explains passcodes are issued by the photographer, offers a contact form and a self-service code re-send to the registered student email.
7. Modal has `role="dialog"`, `aria-modal="true"`, focus trap, Esc to close, and the first field focused on open.

**States:** idle · submitting (spinner on button, inputs disabled) · invalid (inline error, input cleared, focus returned) · rate-limited (countdown text) · captcha-required · success (redirect) · expired-token (redirect back here with a notice).

### 3.3 Private dashboard

1. `GET /albums/:albumId/images?page=1&pageSize=48` — paginated, lazy-loaded grid.
2. Header shows album metadata (ceremony name, date, campus), image count, and account actions (profile, logout).
3. Grid supports single select, a **Select** mode for multi-select, and a floating action bar showing `n selected` with **Download**, **Add to Cart**, **Clear**.
4. Download is configurable per album (`albums.allow_download`); when false the button is hidden and the endpoint returns 403.
5. Infinite scroll via `IntersectionObserver`, with an accessible "Load more" fallback button.

**States:** loading · empty ("Your photos are still being uploaded — check back soon") · partial (some images failed to load, retry per tile) · expired session → redirect to passcode modal.

### 3.4 Image viewer & editing

1. Opens over the grid. Left/right arrows, keyboard `←`/`→`, pinch zoom on touch, `+`/`-` zoom, `0` reset, `Esc` closes.
2. **Non-destructive editing:** the client keeps an edit recipe object and renders it via CSS filters / canvas preview. The original file is never mutated. The recipe is submitted with the cart item so the print lab applies it.
3. Toolbar: Rotate (90° steps), Crop (Free, 1:1, 4:5, 8:10, 16:9), Filters (None, Warm, Cool, B&W, Vivid, Sepia, Film), Intensity slider 0–100%.
4. **Framing panel:** texture, mat, overlay, size. Live price updates from the server catalog; the client never computes the authoritative price.
5. **Add framed print** CTA opens the print-options sheet, then adds to cart.

**States:** image loading · edit preview rendering · price loading (catalog cached) · add-to-cart success (toast + count bump) · error.

### 3.5 Cart & checkout

1. Progress bar: **Cart → Shipping → Payment → Review**.
2. Each line item shows the framed mockup thumbnail, size, frame finish, quantity stepper, per-line price, and remove action.
3. Shipping form: name, email, phone, street, suburb, city, province, postal code, country. Validation inline on blur.
4. Shipping cost: free over R1 500, else R95 standard / R180 express. Tax (VAT 15%) shown as a separate line. Promo codes apply before tax.
5. Payment: PayFast hosted checkout (see 5.5). If an item's photo was deleted since it was added, show **"Image no longer available"** inline with a remove action and disable Pay.
6. Review step recaps items, totals, and address before hand-off.

**States:** cart-empty ("Your cart is empty — browse your photos") · item-unavailable · shipping-invalid · payment-pending · payment-cancelled (return to cart, order stays pending) · order-confirmed.

### 3.6 Order confirmation & status

1. Return URL lands on `/orders/:orderId` with a confirmation summary, order ID, and estimated ship date (created + 7 working days).
2. Status timeline: `pending → paid → printing → quality_check → shipped → delivered` (plus `cancelled`, `refunded`, `failed`).
3. Confirmation email on `paid`, shipping email with tracking URL on `shipped`.

### 3.7 Admin flows

1. **Album create:** metadata → save as draft → upload images → generate passcodes → publish.
2. **Bulk upload:** drop a ZIP of images and/or a CSV mapping `student_identifier,passcode,filename`. For each row: hash passcode, create/link student, upload image to S3, insert `images` row. Reject the whole batch if any passcode is shorter than 6 characters or duplicated within the file. Progress is resumable per file (checksum dedupe).
3. **Passcode management:** view per-student codes (never the plaintext after creation), regenerate, revoke, export CSV (plaintext shown exactly once at generation).
4. **Order queue:** filter by status/date/album, change status, add tracking URL, export CSV print manifest.
5. **Production settings:** frame catalog and pricing, print sizes, shipping tiers, promo codes, default print provider.

---

## 4. Functional Requirements (detailed)

### 4.1 Landing page **[shipped as `/events`]**

- `GET /albums` returns active albums sorted by date, with `id, title, event_date, location, campus, description, public_thumbnail_url, image_count, allow_download`.
- Search across `title`, `campus`, `location`; filters `university`, `from`, `to`, `location`; all server-side.
- Public endpoints are cacheable (`Cache-Control: public, max-age=300, stale-while-revalidate=600`).

### 4.2 Album / passcode access **[gap — current code uses 6-digit global code + JWT]**

- Selecting an album opens a passcode modal; no album images are fetched before successful auth.
- `POST /albums/:albumId/authenticate` returns a JWT scoped as `{ sub, albumId, role: 'student' }`.
- **Support both passcode models:** `albums.passcode_mode = 'per_student' | 'single'`. In `single` mode the album has one code and the resulting session is scoped to the album, not one student; the UI must warn that images are shared and that this weakens per-student privacy.
- Passcodes are stored as `passcode_hash` (scrypt with per-row salt, **[shipped]** `backend/src/lib/crypto.js`) and are never logged.
- Rate limiting is per `(albumId, ip, student_identifier)`.

### 4.3 Private dashboard **[shipped: `/gallery`]**

- Session scoped to one album/account; every image read is ownership-checked.
- Thumbnails first, originals only on demand. Pagination default 48, max 200.
- Optional original download behind `albums.allow_download`.

### 4.4 Image editing & framing **[shipped: `/studio`]**

- Filters are non-destructive preview recipes: `{ rotate, crop, filters: [{ type, intensity }] }`.
- Frame options come from the server catalog: textures, mats, overlays, sizes.
- Price is always recomputed server-side: `photo.price + PRINT_PRICE + Σ(option prices)`, multiplied by quantity. **[shipped]** (`backend/src/services/orderService.js:9`).
- Final print preview mockup = image + mat + frame + background.

### 4.5 Cart & checkout **[shipped: `/purchases` + `CartModal`]**

- Cart lines reference `imageId` + options + edit recipe + quantity.
- Address form, shipping cost, VAT, promo codes.
- Payment via PayFast: signature-signed hosted form, server-side ITN verification, idempotent status transition, amount-mismatch guard. **[shipped]** (`backend/src/services/payfast.js`, `backend/src/routes/payments.js`).
- Confirmation + shipping emails **[gap]**.

### 4.6 Admin **[shipped partial: users, events, moderation, reports, AMS catalog]** · **[gap: album upload, passcode generation, order status UI]**

- Album CRUD, bulk upload, passcode lifecycle, order queue and status transitions, catalog/pricing, reports, admin action audit log.

### 4.7 Security & privacy

See section 17 for the actionable checklist. Core: hashed passcodes, short-TTL signed URLs, rate limiting, HTTPS/HSTS, admin RBAC + audit, GDPR deletion flow.

### 4.8 Non-functional

| Area | Requirement |
| --- | --- |
| Responsive | Mobile-first; breakpoints 390 / 768 / 1024 / 1280 |
| Performance | LCP < 2.5 s on 4G; grid first paint < 1.5 s; 60 fps viewer interactions |
| Availability | 99.5% monthly; static assets via CDN |
| Storage | S3 (or compatible) with on-the-fly derivatives via CDN image transform; local disk adapter for dev/test |
| Accessibility | WCAG 2.1 AA: keyboard operable, visible focus, labelled controls, alt text, 4.5:1 contrast, respects `prefers-reduced-motion` |
| Observability | Structured JSON logs with request IDs; error tracking; audit trail for admin actions |
| Data | Backups daily, 30-day PITR; retention 24 months after ceremony unless deletion requested |

---

## 5. UX Wireframes (text) & Copy

### 5.1 Landing — desktop

```
+------------------------------------------------------------------+
|  UKZN  | Graduation Photos        Search   [Sign in]   (announce)  |  <- glass navbar
+------------------------------------------------------------------+
|  Find your graduation photographs                                |
|  Enter your passcode to view and order your photos.              |
|                                                                  |
|  [ University v ] [ Date from ] [ Date to ] [ Location v ] [Q]   |
|                                                                  |
|  +----------------+  +----------------+  +----------------+      |
|  | [thumbnail]    |  | [thumbnail]    |  | [thumbnail]    |      |
|  | 16 Apr 2026    |  | 28 Mar 2026    |  | 09 May 2026    |      |
|  | Howard College |  | All Campuses   |  | PMB            |      |
|  | Graduation ... |  | Portrait Day   |  | Alumni Reunion |      |
|  | [ Open Album ] |  | [ Open Album ] |  | [ Open Album ] |      |
|  +----------------+  +----------------+  +----------------+      |
+------------------------------------------------------------------+
```

Mobile: single column, filters in a collapsible sheet, cards full width.

### 5.2 Passcode modal

```
+----------------------------------------------+
|  Enter your private passcode          [ x ]  |
|                                              |
|  Graduation Ceremony 2026 — 16 April 2026    |
|                                              |
|  Code                                        |
|  [ A B C 1 2 3                            ]  |
|                                              |
|  (!) That passcode did not match.            |
|      Attempt 2 of 5.                         |
|                                              |
|  [        Unlock my photos        ]          |
|                                              |
|  Need help?  Forgot your passcode?           |
+----------------------------------------------+
```

Copy: title `Enter your private passcode` · helper `Your code was issued by your graduation photographer. It is 6 characters.` · error `That passcode did not match.` · rate-limited `Too many attempts. Try again in 27 minutes.` · captcha `Please confirm you are not a robot.`

### 5.3 Private dashboard

```
+------------------------------------------------------------------+
|  Graduation Ceremony 2026       48 photos      Thandiwe  [Select]|
+------------------------------------------------------------------+
|  [ ] +------+  +------+  +------+  +------+                       |
|      | img  |  | img  |  | img  |  | img  |                       |
|      +------+  +------+  +------+  +------+                       |
|  [ ] +------+  +------+  +------+  +------+                       |
|      | img  |  | img  |  | img  |  | img  |                       |
|      +------+  +------+  +------+  +------+                       |
|                                                                  |
|      | 3 selected    [Download] [Add to Cart] [Clear]  |          |  <- floating bar
+------------------------------------------------------------------+
```

Empty state: `Your photos are still being uploaded — check back soon.`

### 5.4 Image viewer

```
+------------------------------------------------------------------+
|  <    [          image + frame preview        ]        >        |
|                                                                  |
|  Rotate  |  Crop: F 1:1 4:5 8:10 16:9  |  Filters: Warm 40%     |
|                                                                  |
|  Frame: Oak v   Mat: Ivory v   Overlay: UKZN Crest v  8x10 v     |
|                                                                  |
|  Print + frame    R 1 987.00        [ Add framed print ]         |
+------------------------------------------------------------------+
```

### 5.5 Cart & checkout

```
+------------------------------------------------------------------+
|  Cart  >  Shipping  >  Payment  >  Review                        |
+------------------------------------------------------------------+
|  [mockup]  8x10 Oak / Ivory           [- 1 +]   R 1 987.00  [x]  |
|  [mockup]  A4  Black Satin / Ivory    [- 2 +]   R 1 486.00  [x]  |
|                                                                  |
|  Subtotal                          R 3 473.00                    |
|  Promo code  [ GRAD2026 ] [Apply]  - R 347.30                    |
|  Shipping                          Free                          |
|  VAT included (15%)                R   407.70                    |
|  Total                             R 3 125.70                    |
|                                        [ Proceed to Secure Checkout ] |
+------------------------------------------------------------------+
```

### 5.6 Admin order queue

```
+------------------------------------------------------------------+
|  Orders   [All v] [Pending] [Printing] [Shipped]   [Export CSV]  |
+------------------------------------------------------------------+
|  ord-3da9…  Thandiwe   R 1 987.00   paid      16 Sep  [Printing v]|
|  ord-9f12…  Sipho      R  398.00    pending   15 Sep  [Printing v]|
+------------------------------------------------------------------+
|  Tracking URL: [ https://...            ] [Save]                 |
+------------------------------------------------------------------+
```

---

## 6. Information Architecture

```
/                       Landing (public)          [shipped as /events + /]
/album/:albumId         Passcode gate → dashboard [gap; shipped as /gallery]
/album/:albumId/photo/:imageId   Viewer + editor  [shipped as /studio]
/cart                   Cart & checkout           [shipped as CartModal]
/orders                 Order history             [shipped as /purchases]
/orders/:orderId        Order detail / status     [shipped]
/profile                Account & privacy         [shipped]
/help                   Passcode help             [shipped]
/admin                  Admin console             [shipped]
/admin/albums            Album + passcode mgmt    [gap]
/admin/orders            Fulfilment queue          [gap]
```

---

## 7. API Specification (OpenAPI 3.1)

Base URL: `https://api.<domain>/api/v1`. Auth: `Authorization: Bearer <JWT>`. All responses are JSON. Errors use `{ "error": { "code": "string", "message": "string", "requestId": "string" } }`.

`[shipped]` marks routes already live; `[gap]` marks routes to add.

```yaml
openapi: 3.1.0
info:
  title: UKZN Graduation Photo Portal API
  version: 3.1.0
  description: Secure album access, image delivery, framing and order fulfilment.
servers:
  - url: https://api.ukzn.example/api/v1
  - url: http://localhost:3001/api/v1
security:
  - bearerAuth: []
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    Error:
      type: object
      properties:
        error:
          type: object
          properties:
            code: { type: string, example: invalid_code }
            message: { type: string, example: That passcode did not match. }
            requestId: { type: string }
    Album:
      type: object
      properties:
        id: { type: string, example: evt-grad-2026 }
        title: { type: string, example: Graduation Ceremony 2026 }
        eventDate: { type: string, format: date, example: '2026-04-16' }
        campus: { type: string, example: Howard College & Westville }
        location: { type: string, example: Durban }
        description: { type: string }
        publicThumbnailUrl: { type: string }
        imageCount: { type: integer, example: 18420 }
        passcodeMode: { type: string, enum: [per_student, single] }
        allowDownload: { type: boolean, default: false }
    Image:
      type: object
      properties:
        id: { type: string, example: pho-101 }
        albumId: { type: string }
        title: { type: string }
        width: { type: integer, example: 4000 }
        height: { type: integer, example: 5000 }
        thumbUrl: { type: string }
        price: { type: number, example: 189 }
        capturedAt: { type: string, format: date-time }
    FrameCatalog:
      type: object
      properties:
        textures: { type: array, items: { $ref: '#/components/schemas/FrameOption' } }
        mats: { type: array, items: { $ref: '#/components/schemas/FrameOption' } }
        overlays: { type: array, items: { $ref: '#/components/schemas/FrameOption' } }
        sizes: { type: array, items: { $ref: '#/components/schemas/FrameOption' } }
    FrameOption:
      type: object
      properties:
        id: { type: string, example: oak }
        name: { type: string, example: Oak }
        price: { type: number, example: 0 }
    OrderItemInput:
      type: object
      required: [imageId]
      properties:
        imageId: { type: string }
        printSize: { type: string, example: '8x10' }
        texture: { type: string, example: oak }
        mat: { type: string, example: ivory }
        overlay: { type: string, example: ukzn-crest }
        quantity: { type: integer, minimum: 1, maximum: 10, default: 1 }
        edits:
          type: object
          properties:
            rotate: { type: integer, enum: [0, 90, 180, 270] }
            crop: { type: string, example: '8:10' }
            filters:
              type: array
              items:
                type: object
                properties:
                  type: { type: string, example: warm }
                  intensity: { type: number, minimum: 0, maximum: 1 }
    Order:
      type: object
      properties:
        id: { type: string, example: ord-3da97ca700547cd8 }
        status: { type: string, enum: [pending, paid, printing, quality_check, shipped, delivered, cancelled, refunded, failed] }
        total: { type: number, example: 1987 }
        paymentRef: { type: string }
        gateway: { type: string, example: PayFast }
        trackingUrl: { type: string, nullable: true }
        createdAt: { type: string, format: date-time }
        items: { type: array, items: { $ref: '#/components/schemas/OrderItemInput' } }
paths:
  /health:
    get:
      summary: Liveness and readiness probe
      security: []
      responses:
        '200':
          description: Service health
  /auth/login:
    post:
      summary: Exchange an access code or email for a JWT
      security: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                email: { type: string, format: email }
                role: { type: string, enum: [student, admin] }
                code: { type: string, pattern: '^[0-9]{6}$' }
      responses:
        '200': { description: Token + user }
        '401': { description: Invalid credentials, content: { application/json: { schema: { $ref: '#/components/schemas/Error' } } } }
        '429': { description: Rate limited }
  /auth/request-code:
    post:
      summary: Send a one-time access code to the registered email
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email: { type: string, format: email }
      responses:
        '200': { description: Code dispatched }
  /auth/me:
    get:
      summary: Current authenticated user
      responses:
        '200': { description: User }
  /albums:
    get:
      summary: List public album cards
      security: []
      parameters:
        - { in: query, name: university, schema: { type: string } }
        - { in: query, name: location, schema: { type: string } }
        - { in: query, name: from, schema: { type: string, format: date } }
        - { in: query, name: to, schema: { type: string, format: date } }
        - { in: query, name: q, schema: { type: string } }
      responses:
        '200':
          description: Album list
          content:
            application/json:
              schema:
                type: object
                properties:
                  albums: { type: array, items: { $ref: '#/components/schemas/Album' } }
  /albums/{albumId}/thumbnail:
    get:
      summary: Album card thumbnail
      security: []
      parameters:
        - { in: path, name: albumId, required: true, schema: { type: string } }
      responses:
        '200': { description: Thumbnail URL }
        '404': { description: Not found }
  /albums/{albumId}/authenticate:
    post:
      summary: Validate a passcode and mint a scoped session
      security: []
      parameters:
        - { in: path, name: albumId, required: true, schema: { type: string } }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [passcode]
              properties:
                passcode: { type: string, minLength: 6, maxLength: 12 }
                captchaToken: { type: string }
      responses:
        '200': { description: JWT scoped to the album }
        '401': { description: Passcode did not match }
        '429': { description: Too many attempts }
  /albums/{albumId}/images:
    get:
      summary: List images for the authenticated session
      parameters:
        - { in: path, name: albumId, required: true, schema: { type: string } }
        - { in: query, name: page, schema: { type: integer, minimum: 1, default: 1 } }
        - { in: query, name: pageSize, schema: { type: integer, minimum: 1, maximum: 200, default: 48 } }
      responses:
        '200': { description: Paginated images }
        '401': { description: Session expired }
  /images/{imageId}/derivative:
    get:
      summary: Signed URL or transformed derivative
      parameters:
        - { in: path, name: imageId, required: true, schema: { type: string } }
        - { in: query, name: size, schema: { type: string, example: '800x1000' } }
        - { in: query, name: frame, schema: { type: string } }
      responses:
        '200':
          description: Signed, short-TTL URL
          content:
            application/json:
              schema:
                type: object
                properties:
                  url: { type: string }
                  expiresIn: { type: integer, example: 900 }
        '403': { description: Not your image }
        '410': { description: Image deleted }
  /frames:
    get:
      summary: Frame, mat, overlay and size catalog with prices
      security: []
      responses:
        '200':
          description: Catalog
          content:
            application/json:
              schema: { $ref: '#/components/schemas/FrameCatalog' }
  /user/orders:
    get:
      summary: List the caller's orders
      responses:
        '200': { description: Orders }
    post:
      summary: Create a pending order and return the PayFast redirect
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [items]
              properties:
                items:
                  type: array
                  minItems: 1
                  maxItems: 20
                  items: { $ref: '#/components/schemas/OrderItemInput' }
      responses:
        '201': { description: Order + signed payment redirect }
        '400': { description: Unknown photo or option }
  /orders/{orderId}:
    get:
      summary: Order detail (owner or admin)
      parameters:
        - { in: path, name: orderId, required: true, schema: { type: string } }
      responses:
        '200': { description: Order }
        '403': { description: Not your order }
        '404': { description: Not found }
  /payments/payfast/itn:
    post:
      summary: PayFast instant transaction notification webhook
      security: []
      responses:
        '200': { description: Applied or idempotently ignored }
        '400': { description: Bad signature or amount mismatch }
  /media:
    post:
      summary: Upload an image (base64 JSON today, pre-signed S3 POST at scale)
      responses:
        '201': { description: Stored object }
        '413': { description: Payload exceeds 8 MB }
  /admin/albums:
    post:
      summary: Create an album
      responses:
        '201': { description: Album }
  /admin/albums/{albumId}/images:
    post:
      summary: Upload images into an album
      responses:
        '201': { description: Uploaded }
  /admin/albums/{albumId}/passcodes:
    post:
      summary: Generate per-student passcodes from a CSV
      responses:
        '201': { description: Generated, plaintext returned once }
  /admin/orders/{orderId}/status:
    post:
      summary: Advance fulfilment status
      requestBody:
        content:
          application/json:
            schema:
              type: object
              required: [status]
              properties:
                status: { type: string, enum: [printing, quality_check, shipped, delivered, cancelled, refunded] }
                trackingUrl: { type: string, nullable: true }
      responses:
        '200': { description: Updated order }
  /admin/reports:
    get:
      summary: Dashboard metrics
      responses:
        '200': { description: Reports }
```

---

## 8. Database Schema & ER Diagram (text)

Types are limited to `TEXT` / `INTEGER` / `REAL` so one DDL serves both SQLite and PostgreSQL.

### 8.1 Entity relationships

```
users 1───────────* images              (owner; images.student_id → users.id)
users 1───────────* orders              (orders.student_id → users.id)
users 1───────────* passcodes           (per-student passcodes)
albums (events) 1──* images             (images.event_id → events.id)
albums 1──────────* passcodes           (passcodes.album_id → events.id)
orders 1──────────* order_items         (order_items.order_id → orders.id)
images 1──────────* order_items         (order_items.photo_id → images.id)
orders 1──────────* payment_events      (payment_events.order_id → orders.id)
textures / mats / overlays / frame_sizes  (catalog, referenced by name in order_items)
users 1───────────* access_codes        (one-time login codes; access_codes.user_id → users.id)
users 1───────────* audit_logs          (admin actions)
```

An order is a financial snapshot: `order_items` copies the price, title and options at purchase time so later catalog changes never rewrite history.

### 8.2 Tables

**users** — `id PK`, `student_number`, `name`, `email UNIQUE`, `campus`, `faculty`, `degree`, `identifier`, `role` (`student|admin`), `status` (`active|pending|suspended`), `department`, `avatar_hue`, `pin_hash`, `created_at`. **[shipped]**

**access_codes** — `id PK`, `user_id FK`, `code_hash`, `channel`, `expires_at`, `consumed_at`, `created_at`. **[shipped]**

**events** *(the album table)* — `id PK`, `name`, `campus`, `event_date`, `status` (`draft|published|archived`), `photos`, `photographers`, `created_at`. **[shipped]** · Target columns to add **[gap]**: `description`, `location`, `public_thumbnail_url`, `passcode_mode`, `allow_download`.

**passcodes** **[gap]** — `id PK`, `album_id FK → events.id`, `student_id FK → users.id NULL` (null when `passcode_mode = single`), `student_identifier`, `passcode_hash`, `passcode_salt`, `failed_attempts INTEGER DEFAULT 0`, `locked_until`, `last_used_at`, `created_at`.

**photos** *(the image table)* — `id PK`, `student_id FK`, `identifier`, `title`, `event_id FK`, `event_name`, `campus`, `captured_at`, `resolution`, `file_size`, `s3_key`, `storage_key`, `price`, `tagged`, `moderated`, `favourite`, `photo_type`, `location`, `url`, `thumb_url`, `created_at`. **[shipped]**

**textures / mats / overlays / frame_sizes** — `id PK`, `name`, plus `family/hex/width/height/price`. **[shipped]**

**orders** — `id PK`, `student_id FK`, `identifier`, `status`, `total`, `payment_ref`, `gateway`, `created_at`, `updated_at`. **[shipped]** · Add **[gap]**: `shipping_json`, `tracking_url`, `promo_code`, `shipped_at`.

**order_items** — `id PK`, `order_id FK`, `photo_id FK`, `title`, `kind`, `texture`, `mat`, `overlay`, `size`, `qty`, `price`, plus **[gap]** `edits_json`. **[shipped]**

**payment_events** — `id PK`, `order_id FK`, `payment_ref`, `status`, `amount`, `raw`, `created_at`. **[shipped]**

**audit_logs** **[gap]** — `id PK`, `actor_id`, `actor_role`, `action`, `target_type`, `target_id`, `ip`, `user_agent`, `metadata`, `created_at`.

**carts** **[gap, optional]** — the shipped design keeps the cart client-side and prices on submit, so a server-side cart table is only needed for cross-device persistence. `id PK`, `user_id FK`, `items_json`, `expires_at`, `created_at`.

**deletion_requests** **[gap]** — `id PK`, `user_id`, `email`, `status`, `requested_at`, `completed_at`.

Indexes: `photos(student_id)`, `photos(identifier)`, `orders(student_id)`, `order_items(order_id)`, `access_codes(user_id)` **[shipped]**; add `passcodes(album_id)`, `passcodes(passcode_hash)`, `audit_logs(created_at)`.

---

## 9. Sample JSON Payloads

### 9.1 Authenticate

`POST /api/v1/albums/evt-grad-2026/authenticate`

```json
{
  "passcode": "ABC123"
}
```

`200 OK`

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "albumId": "evt-grad-2026",
  "user": {
    "id": "stu-001",
    "name": "Thandiwe Nkosi",
    "identifier": "UKZN-2026-X898",
    "role": "student"
  },
  "expiresInSeconds": 43200
}
```

`401 Unauthorized`

```json
{
  "error": {
    "code": "invalid_code",
    "message": "That passcode did not match.",
    "requestId": "req_8f2c1a"
  }
}
```

### 9.2 Add to cart / create order

`POST /api/v1/user/orders`

```json
{
  "items": [
    {
      "imageId": "pho-101",
      "printSize": "8x10",
      "texture": "oak",
      "mat": "ivory",
      "quantity": 1,
      "edits": {
        "rotate": 0,
        "crop": "8:10",
        "filters": [{ "type": "warm", "intensity": 0.6 }]
      }
    }
  ]
}
```

`201 Created` — the server recomputed `R 1 987.00` from the catalog (`189 + 299 + 1499`).

```json
{
  "order": {
    "id": "ord-3da97ca700547cd8",
    "status": "pending",
    "total": 1987,
    "paymentRef": "PAYFAST-3F9A21",
    "gateway": "PayFast",
    "createdAt": "2026-09-16T00:04:53.201Z",
    "items": [
      {
        "photoId": "pho-101",
        "title": "Professional Headshot - Thandiwe N.",
        "kind": "print+frame",
        "texture": "oak",
        "mat": "ivory",
        "overlay": null,
        "size": "8x10",
        "qty": 1,
        "price": 1987
      }
    ]
  },
  "payment": {
    "gateway": "PayFast",
    "status": "pending",
    "reference": "PAYFAST-3F9A21",
    "redirect": {
      "action": "https://sandbox.payfast.co.za/eng/process",
      "method": "POST",
      "fields": {
        "merchant_id": "10000100",
        "merchant_key": "46f0cd694581a",
        "return_url": "http://localhost:5173/purchases",
        "cancel_url": "http://localhost:5173/purchases",
        "notify_url": "http://localhost:3001/api/v1/payments/payfast/itn",
        "name_first": "Thandiwe",
        "name_last": "Nkosi",
        "email_address": "thandiwe.nkosi@stu.ukzn.ac.za",
        "m_payment_id": "ord-3da97ca700547cd8",
        "amount": "1987.00",
        "item_name": "UKZN Photo Portal order",
        "item_description": "Professional Headshot - Thandiwe N.",
        "custom_str1": "UKZN-2026-X898",
        "email_confirmation": "1",
        "signature": "9c1f4e7b2a6d8e0f3b5c7a9d1e2f4a6b"
      }
    }
  }
}
```

### 9.3 PayFast ITN (webhook)

`POST /api/v1/payments/payfast/itn` (form-encoded)

```
m_payment_id=ord-3da97ca700547cd8
pf_payment_id=1234567
payment_status=COMPLETE
amount_gross=1987.00
merchant_id=10000100
signature=9c1f4e7b2a6d8e0f3b5c7a9d1e2f4a6b
```

`200 OK`

```json
{ "ok": true, "orderId": "ord-3da97ca700547cd8", "status": "paid" }
```

Re-delivery is idempotent:

```json
{ "ok": true, "orderId": "ord-3da97ca700547cd8", "status": "paid", "idempotent": true }
```

### 9.4 Signed image URL

`GET /api/v1/media/pho-101/url`

```json
{
  "photoId": "pho-101",
  "driver": "s3",
  "url": "https://ukzn-photos.s3.af-south-1.amazonaws.com/events/evt-grad-2026/UKZN-2026-X898/pho-101.jpg?X-Amz-Expires=900&X-Amz-Signature=...",
  "expiresIn": 900
}
```

---

## 10. React Component Contracts

### 10.1 `<ImageViewer />`

```jsx
<ImageViewer
  image={{
    id: 'pho-101',
    title: 'Professional Headshot - Thandiwe N.',
    fullUrl: 'https://cdn.example/…/pho-101.jpg',
    width: 4000,
    height: 5000,
    price: 189
  }}
  images={photoList}
  index={3}
  catalog={{ textures, mats, overlays, sizes }}
  initialEdits={{ rotate: 0, crop: '8:10', filters: [{ type: 'warm', intensity: 0.6 }] }}
  allowDownload={false}
  onClose={() => {}}
  onChangeIndex={(next) => {}}
  onAddToCart={(item) => {}}
  onDownload={(image) => {}}
/>
```

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `image` | `Image` | yes | — | Currently displayed image |
| `images` | `Image[]` | no | `[image]` | Enables next/prev |
| `index` | `number` | no | `0` | Controlled position |
| `catalog` | `FrameCatalog` | yes | — | Server-priced options |
| `initialEdits` | `Edits` | no | `{}` | Restore a saved recipe |
| `allowDownload` | `boolean` | no | `false` | Hides the download action |
| `onClose` | `() => void` | yes | — | Esc / backdrop / close button |
| `onChangeIndex` | `(i: number) => void` | no | — | Arrow keys |
| `onAddToCart` | `(item: OrderItemInput) => void` | yes | — | Receives full recipe |
| `onDownload` | `(image: Image) => void` | no | — | Only fires when allowed |

Accessibility: `role="dialog"`, `aria-modal`, focus trap, `←`/`→`/`+`/`-`/`0`/`Esc` bindings, `prefers-reduced-motion` disables transitions.

### 10.2 `<CartItem />`

```jsx
<CartItem
  item={{
    id: 'itm-1',
    imageId: 'pho-101',
    title: 'Professional Headshot - Thandiwe N.',
    thumbUrl: 'https://cdn.example/…/pho-101-thumb.jpg',
    printSize: '8x10',
    texture: 'oak',
    mat: 'ivory',
    overlay: 'none',
    quantity: 1,
    unitPrice: 1987,
    edits: { rotate: 0, crop: '8:10', filters: [{ type: 'warm', intensity: 0.6 }] }
  }}
  maxQuantity={10}
  unavailable={false}
  onQuantityChange={(id, qty) => {}}
  onRemove={(id) => {}}
  onEdit={(id) => {}}
/>
```

| Prop | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `item` | `CartLine` | yes | — | Includes recipe + priced options |
| `maxQuantity` | `number` | no | `10` | Stepper ceiling |
| `unavailable` | `boolean` | no | `false` | Renders "Image no longer available" and disables edit |
| `onQuantityChange` | `(id, qty) => void` | yes | — | Clamped 1..maxQuantity |
| `onRemove` | `(id) => void` | yes | — | |
| `onEdit` | `(id) => void` | no | — | Reopens viewer with the recipe |

---

## 11. Example SQL Queries

**Images for an authenticated session (student scope).**

```sql
-- Resolve the session's student from the album + identifier, then page the images.
SELECT p.id, p.title, p.thumb_url, p.url, p.width, p.height, p.price, p.captured_at
FROM photos p
WHERE p.event_id = :albumId
  AND p.student_id = :studentId
ORDER BY p.captured_at DESC, p.id
LIMIT :pageSize OFFSET :offset;
```

**Single-passcode album session (album scope, no student filter).**

```sql
SELECT p.*
FROM photos p
JOIN events e ON e.id = p.event_id
WHERE e.id = :albumId
  AND e.passcode_mode = 'single'
ORDER BY p.captured_at DESC
LIMIT :pageSize OFFSET :offset;
```

**Validate a passcode without leaking existence.**

```sql
SELECT id, student_id, passcode_hash, failed_attempts, locked_until
FROM passcodes
WHERE album_id = :albumId
  AND (student_identifier = :identifierOrNull OR :identifierOrNull IS NULL)
  AND passcode_hash = :candidateHash
LIMIT 1;
```

**Order with items and payment trail.**

```sql
SELECT o.id, o.status, o.total, o.payment_ref, o.created_at,
       i.id AS item_id, i.title, i.texture, i.mat, i.overlay, i.size, i.qty, i.price,
       pe.status AS payment_status, pe.amount AS paid_amount
FROM orders o
LEFT JOIN order_items i   ON i.order_id = o.id
LEFT JOIN payment_events pe ON pe.order_id = o.id
WHERE o.student_id = :studentId
ORDER BY o.created_at DESC;
```

**Revenue by album (admin report).**

```sql
SELECT e.name AS album, COUNT(DISTINCT o.id) AS orders, SUM(o.total) AS revenue
FROM orders o
JOIN order_items i ON i.order_id = o.id
JOIN photos p      ON p.id = i.photo_id
JOIN events e      ON e.id = p.event_id
WHERE o.status = 'paid'
GROUP BY e.name
ORDER BY revenue DESC;
```

---

## 12. Email Templates

### 12.1 Order confirmation

Subject: `Your UKZN photo order ord-3da97ca700547cd8 is confirmed`

```
Hi Thandiwe,

Thank you — we have received your payment of R 1 987.00.

Order:    ord-3da97ca700547cd8
Placed:   16 September 2026
Items:
  - 8x10 Oak frame, Ivory mat, UKZN Crest overlay  x1   R 1 987.00

Your photographs are now with our print lab. Estimated dispatch: 23 September 2026.
We will email tracking details the moment your parcel leaves the studio.

Track your order: https://portal.ukzn.example/orders/ord-3da97ca700547cd8

UKZN Graduation Photography
```

### 12.2 Shipped

Subject: `Your UKZN photo order has been shipped`

```
Hi Thandiwe,

Good news — order ord-3da97ca700547cd8 is on its way.

Courier:    The Courier Guy
Tracking:   https://tracking.example/TK-889123456
Dispatched: 22 September 2026

If anything looks damaged on arrival, reply to this email within 14 days and we
will reprint at no cost.

UKZN Graduation Photography
```

Plain-text versions mirror the HTML exactly. Both include an unsubscribe/deletion-request link and the university's data-protection contact.

---

## 13. Admin & Operational Workflows

### 13.1 Bulk upload

1. Admin selects/creates the album and drops a ZIP archive plus an optional CSV.
2. CSV schema: `student_identifier,passcode,filename`. Validate: identifier matches `^UKZN-\d{4}-[A-Z]\d{3}$`, passcode ≥ 6 chars, no duplicate passcodes in the file, every `filename` present in the ZIP.
3. For each row: create/link `users` record, hash the passcode with scrypt, insert `passcodes`, upload the image to S3 (`events/{albumId}/{identifier}/{photoId}.jpg`), insert `photos`.
4. Resume: files are keyed by SHA-256 checksum, so re-running a partially failed batch skips already-uploaded objects.
5. Reject the entire batch if any validation fails; report row-level errors in the UI.
6. Plaintext passcodes are downloadable exactly once, immediately after generation.

### 13.2 Order fulfilment

`pending` (created, awaiting payment) → `paid` (ITN verified) → `printing` → `quality_check` → `shipped` (tracking URL required) → `delivered`.

- Cancellation allowed before `printing`; after printing, returns follow policy.
- Refunds set `refunded` and write an `audit_logs` row.
- The queue supports CSV export of a print manifest (order, item, size, frame, overlay, shipping address) for the print lab.

### 13.3 Refund / cancellation policy

| Stage | Customer may cancel | Refund |
| --- | --- | --- |
| `pending`, `paid` | Yes, self-service | Full |
| `printing` | No | Partial at management discretion |
| `quality_check`+ | No | Return per policy; reprint on defect within 14 days |

---

## 14. Acceptance Criteria & Commandable Tests

### AC1 — Album-scoped session
An authenticated session for album A can read images in A and receives `403` for any image belonging to album B or another student.

```bash
# Valid code → token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"code":"123456"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

# Another student's photo must be forbidden
curl -s -o /dev/null -w '%{http_code}\n' \
  http://localhost:3001/api/v1/photos/pho-999 \
  -H "Authorization: Bearer $TOKEN"
# expect: 403 or 404
```

### AC2 — Wrong passcode is denied and rate-limited

```bash
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "attempt $i: %{http_code}\n" \
    -X POST http://localhost:3001/api/v1/auth/login \
    -H 'Content-Type: application/json' \
    -d '{"code":"000000"}'
done
# expect: 401,401,401,401,401 then 429 under the target rate-limiter
```

### AC3 — Framed price is correct in cart and on the order

```bash
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' -d '{"code":"123456"}' \
  | node -pe 'JSON.parse(require("fs").readFileSync(0)).token')

curl -s -X POST http://localhost:3001/api/v1/user/orders \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"items":[{"photoId":"pho-101","texture":"oak","mat":"ivory","size":"8x10","qty":1}]}' \
  | node -pe 'const o=JSON.parse(require("fs").readFileSync(0)).order; `${o.total} ${o.items[0].price}`'
# expect: 1987 1987
```

### AC4 — Admin generates passcodes and students can use them
Automated: seed an album, POST a CSV of `identifier,passcode`, then call `authenticate` with that passcode and assert a `200` plus a token scoped to the album.

### AC5 — PayFast ITN is verified and idempotent
Replay the same ITN twice; the order is `paid` once and the second response carries `"idempotent": true`. A tampered `amount_gross` yields `400 amount_mismatch` and no status change.

### Unit tests — passcode validation (Node's built-in runner)

```js
// backend/test/passcodes.test.js
import test from 'node:test'
import assert from 'node:assert/strict'
import { hashSecret, verifySecret } from '../src/lib/crypto.js'

test('correct passcode verifies', () => {
  const stored = hashSecret('ABC123')
  assert.equal(verifySecret('ABC123', stored), true)
})

test('wrong passcode fails', () => {
  const stored = hashSecret('ABC123')
  assert.equal(verifySecret('ABC124', stored), false)
})

test('hashes are salted per call', () => {
  assert.notEqual(hashSecret('ABC123'), hashSecret('ABC123'))
})
```

Run everything:

```bash
cd backend && npm test
```

---

## 15. E2E Test Scenarios (5+)

Playwright, Chromium + mobile viewport, against a seeded environment.

**E2E-1 — Public discovery to private dashboard.**
Land on `/`, filter to "Howard College", assert the ceremony card is visible, click **Open Album**, enter the correct passcode, assert the dashboard shows only `stu-001` images and the header count matches the API.

**E2E-2 — Wrong passcode, lockout and recovery.**
Open the modal, submit a wrong code 5 times, assert the inline error, assert the CAPTCHA/rate-limit state appears, assert a valid code still succeeds from a fresh IP/cleared limiter (seed reset).

**E2E-3 — Edit, frame, add to cart, checkout at the correct price.**
Open a photo, apply Warm 60%, rotate 90°, choose Oak / Ivory / UKZN Crest / 8x10, assert the viewer price reads `R 1 987.00`, add it, assert the cart line matches, proceed to PayFast sandbox, complete payment, assert the redirect lands on `/orders/:id` showing `paid`.

**E2E-4 — Admin upload to student access.**
As admin, create an album, upload three images mapped to a new identifier, generate a passcode from CSV, log out, authenticate as that student, assert exactly three images are visible and no others.

**E2E-5 — Unavailable image handling.**
Add a photo to the cart, delete/soft-delete that photo server-side, reload the cart, assert **"Image no longer available"** appears, assert Pay is disabled until the line is removed, then assert checkout proceeds once cleared.

**E2E-6 — Session expiry.**
With a short-lived token, let it expire, navigate to the dashboard, assert redirect to the passcode modal with the "session expired" notice and that the original album is preselected.

**E2E-7 — Fulfilment transition and tracking email.**
Admin moves a paid order `printing → quality_check → shipped` with a tracking URL, assert the status timeline on `/orders/:id` and that the shipping email job is queued with the tracking URL.

---

## 16. Edge Cases & Error Handling

| Case | Behaviour |
| --- | --- |
| Expired JWT | `401 invalid_token`; client redirects to the passcode modal with a notice and preserves the intended album |
| Image deleted while in cart | Line shows "Image no longer available"; edit disabled; Pay blocked until removed |
| Unknown frame/size option | `400 unknown_size` etc.; client refreshes the catalog |
| Duplicate ITN delivery | Idempotent `paid`; no double payment event |
| Tampered ITN amount | `400 amount_mismatch`; payment event recorded for investigation; order unchanged |
| Partial upload failure | Batch reports failing rows; successful objects are deduped by checksum on retry |
| Two students share a passcode (`single` mode) | UI warning about privacy impact; audit rows mark the session as shared; admins are advised against it |
| Passcode rotation mid-session | Existing sessions live until JWT expiry (≤12 h); new auth uses the new code |
| Very large order | Capped at 20 lines and quantity 10; `400 too_many_items` |
| Offline during checkout | Payment never silently marks paid; status only changes on a verified ITN |
| Image orientation metadata | EXIF orientation applied server-side when generating derivatives |
| Unicode / RTL names on print | Print manifest encodes UTF-8 and uses a Unicode-capable font |
| No results after filtering | Explicit filtered-empty state with a clear-filters action, never a blank screen |

---

## 17. Security & Privacy Checklist

**Authentication & passcodes**

- [x] Passcodes hashed with scrypt + per-row salt, never stored or logged in plaintext. **[shipped]** (`lib/crypto.js`)
- [x] Stateless HS256 JWT with configurable expiry (default 12 h). **[shipped]** (`lib/jwt.js`)
- [ ] Rate-limit `authenticate` per `(albumId, ip, identifier)`: 5 attempts / 15 min, CAPTCHA after 5, 30-minute lock after 10. **[gap]**
- [ ] Optional TOTP 2FA for admin accounts. **[gap]**
- [ ] `HttpOnly`, `Secure`, `SameSite=Strict` cookies for any browser session token; today the JWT is held in `localStorage`. **[gap]**
- [ ] Password/code re-send requires a verified channel (email on file); responses are uniform to avoid account enumeration. **[gap]**

**Image privacy & delivery**

- [x] Ownership checked on every read; non-admins cannot fetch another student's photo. **[shipped]** (`routes/media.js`, `routes/photos.js`)
- [x] Short-TTL signed URLs for S3 with a 900 s default. **[shipped]** (`services/storage.js`)
- [ ] Public bucket access disabled by default; bucket policy allows only the app role. **[gap — infra]**
- [ ] CDN signed cookies for derivative access; no permanent public object URLs. **[gap — infra]**

**Transport & headers**

- [ ] HTTPS everywhere with HSTS `max-age=31536000; includeSubDomains; preload`. **[gap — infra]**
- [ ] Security headers: `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`. **[gap]**
- [x] CORS origin allow-list and `x-powered-by` disabled. **[shipped]** (`app.js`)

**Authorization & audit**

- [x] RBAC with `requireAuth` / `requireAdmin`. **[shipped]**
- [ ] `audit_logs` for every admin action (album, passcode, price, order status, refund) with actor, IP and timestamp. **[gap]**
- [x] Order totals recomputed server-side; the client cannot set the price. **[shipped]** (`orderService.js`)
- [ ] Admin endpoints for album/passcode management gated behind `requireAdmin`. **[gap — route not yet built]**

**Data protection & compliance (POPIA / GDPR)**

- [x] Minimal data model; no payment card data ever touches our servers (PayFast hosted checkout). **[shipped]**
- [ ] Self-service deletion request flow (`deletion_requests`) with 30-day completion and confirmation email. **[gap]**
- [ ] Retention: purge album images and personal data 24 months after the ceremony unless the graduate opts in.
- [ ] Data Processing Agreement with the print lab; images shared only for the specific order.
- [ ] Breach notification runbook with a 72-hour reporting clock.

**Operational**

- [ ] Secrets from a managed store; `.env` never committed (verify with a pre-commit secret scan).
- [ ] Dependency and container image scanning in CI.
- [ ] Rate limiting on upload and checkout endpoints to prevent abuse and cost blowout.
- [ ] Backups encrypted at rest, restore rehearsed quarterly.

---

## 18. Analytics & Events

Client-side, batched, no PII (pseudonymous `session_id` only).

| Event | When | Key properties |
| --- | --- | --- |
| `album_card_click` | Card CTA pressed | `album_id`, `position` |
| `passcode_attempt` | Submit | `album_id`, `result: success \| fail`, `attempt_no` |
| `dashboard_open` | Dashboard mounted | `album_id`, `image_count` |
| `image_view` | Viewer opened | `image_id`, `album_id`, `position` |
| `filter_apply` | Filter changed | `filter_type`, `intensity` |
| `frame_preview` | Frame option changed | `texture/mat/overlay/size` |
| `add_to_cart` | Add pressed | `image_id`, `unit_price`, `options` |
| `checkout_start` | Shipping step entered | `cart_value`, `item_count` |
| `checkout_payment_initiated` | PayFast hand-off | `order_id`, `amount` |
| `checkout_complete` | Return with paid order | `order_id`, `amount` |
| `order_shipped` | Admin status change | `order_id`, `days_to_ship` |
| `passcode_recovery_request` | Help form submitted | `album_id` |

Funnels: `album_card_click → passcode_attempt(success) → dashboard_open → image_view → add_to_cart → checkout_start → checkout_complete`, sliced per album, campus and device. Track drop-off at each step and alert when passcode success rate drops below 85%.

---

## 19. Non-Functional Requirements

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR1 | LCP < 2.5 s on a mid-range Android over 4G | Lighthouse CI on `/` and dashboard |
| NFR2 | Viewer holds 60 fps while zooming/rotating | DevTools performance trace |
| NFR3 | Grid renders 500 thumbnails without jank | Virtualised list; scroll test |
| NFR4 | WCAG 2.1 AA | axe-core in CI + manual keyboard/screen-reader pass |
| NFR5 | API p95 < 300 ms for list endpoints (excluding S3) | Load test with k6 at 200 rps |
| NFR6 | 99.5% monthly availability | Uptime monitor + status page |
| NFR7 | Zero plaintext passcodes at rest or in logs | Code review + log scan |
| NFR8 | Backup restore proven quarterly | Documented rehearsal |

---

## 20. Implementation Plan & Priorities

### 20.1 Priority list

| Priority | Workstream | Why now |
| --- | --- | --- |
| P0 | Album-scoped passcode auth + rate limiting | Core privacy promise; blocks launch |
| P0 | Signed image delivery hardening (private bucket, CDN) | Prevents image leakage |
| P0 | Order confirmation + shipping emails | Closes the customer loop |
| P1 | Admin album upload + passcode generation | Without it, staff cannot onboard a ceremony |
| P1 | Order fulfilment queue + status transitions + tracking | Revenue realisation |
| P1 | Non-destructive edit recipe persisted to the order | Print matches what the student saw |
| P2 | Shipping cost, VAT and promo codes | Margin accuracy |
| P2 | Server-side cart persistence (cross-device) | Convenience, recovers abandoned carts |
| P2 | Analytics funnel | Optimisation |
| P3 | Admin 2FA, audit log UI, deletion self-service | Compliance maturity |
| P3 | Photographer role, vendor API integration | Scale |

### 20.2 Six-week MVP sprint plan

Assumes one backend engineer, one frontend engineer, one designer (50%), one QA (50%).

**Week 1 — Foundations & album access.**
Design: hi-fi mobile + desktop for landing, passcode modal, dashboard, viewer. Engineering: `albums` metadata columns, `passcodes` table + scrypt hashing, `POST /albums/:albumId/authenticate`, rate limiter, landing page against `GET /albums`, passcode modal. QA: passcode unit tests, AC1 + AC2. Demo: a graduate unlocks their album.

**Week 2 — Private dashboard & image delivery.**
Scoped `GET /albums/:albumId/images`, ownership-enforced `GET /images/:imageId/derivative`, S3 adapter verified with private bucket + short-TTL signed URLs, thumbnail grid with pagination and lazy loading, empty/expired states. QA: E2E-1, E2E-6, NFR3. Demo: secure private gallery.

**Week 3 — Viewer, editing, framing.**
`ImageViewer` with keyboard/pinch zoom and next/prev, rotate/crop/filter recipes, frame catalog panel with live server pricing, framed mockup preview, add-to-cart. QA: AC3, E2E-3 (through add-to-cart), NFR2. Demo: frame a photo and see the correct price.

**Week 4 — Cart & checkout.**
Cart page with the four-step progress bar, quantity/edit/remove, shipping + VAT + promo, PayFast hand-off, ITN verification and idempotency, order confirmation page. QA: AC3 + AC5, E2E-3, E2E-5. Demo: end-to-end purchase in sandbox.

**Week 5 — Admin & fulfilment.**
Album CRUD UI, bulk upload (ZIP + CSV) with checksum resume, passcode generation/rotation/export, order queue with status transitions and tracking URL, CSV print manifest export. QA: AC4, E2E-4, E2E-7. Demo: staff onboards a ceremony and ships an order.

**Week 6 — Hardening, email, accessibility, launch prep.**
Confirmation + shipping email templates and delivery, security headers, HSTS, CSP, audit logging, deletion-request flow, axe and keyboard audit, k6 load test, runbook and admin manual, go/no-go. QA: full regression, E2E-1..7 green. Demo: launch readiness review.

**Definition of done for the MVP.** All P0 and P1 items complete; AC1–AC5 pass in CI; E2E-1 to E2E-7 green; no plaintext passcodes in logs; Lighthouse ≥ 90 accessibility; runbook approved.

---

## 21. Current Implementation Status (traceability)

| Spec area | Status | Where |
| --- | --- | --- |
| Express layered architecture | shipped | `backend/src/app.js`, `lib/`, `middleware/` |
| SQLite + PostgreSQL adapter | shipped | `backend/src/db/` |
| Repository layer + mappers | shipped | `backend/src/repositories/` |
| 6-digit code → JWT login | shipped | `routes/auth.js`, `services/authService.js` |
| Hashed secrets (scrypt) | shipped | `lib/crypto.js` |
| Ownership enforcement on photos/media | shipped | `routes/photos.js`, `routes/media.js` |
| S3 + local storage, signed URLs | shipped | `services/storage.js` |
| Frame/mat/overlay/size catalog + pricing | shipped | `services/orderService.js`, `db/seed.js` |
| Pending order + PayFast redirect | shipped | `services/payfast.js`, `routes/orders.js` |
| ITN verify, amount guard, idempotency | shipped | `routes/payments.js` |
| Admin users/events/moderation/reports | shipped | `routes/admin.js` |
| Identifier generation (`UKZN-2026-X898`) | shipped | `routes/identifier.js`, `lib/crypto.js` |
| React SPA, 11 pages, whiteout design system | shipped | `frontend/src/` |
| Dockerfiles, compose, CI | shipped | `Dockerfile`, `docker-compose.yml`, `.github/workflows/ci.yml` |
| **Album-scoped passcode model** | gap | Add `passcodes` table + `/albums/:id/authenticate` |
| **Rate limiting + CAPTCHA** | gap | New middleware + attempt counters |
| **Non-destructive edit recipe** | partial | Studio UI exists; recipe not persisted to `order_items.edits_json` |
| **Shipping, VAT, promo codes** | partial | Checkout UI exists; server-side calculation not implemented |
| **Confirmation / shipping emails** | gap | New mailer service + templates |
| **Admin bulk upload + passcode generation** | gap | New admin routes + UI |
| **Order fulfilment status + tracking** | partial | Status column exists; transition endpoint + UI are gaps |
| **Audit logs** | gap | New table + middleware |
| **GDPR deletion flow** | gap | New `deletion_requests` + scheduled job |
| **Analytics events** | gap | New client analytics module |

**Recommended reconciliation.** Keep the shipped `events` table as the album entity (rename the API surface to `/albums` with `/events` aliased for backward compatibility) and add the `passcodes` table rather than replacing the JWT flow. The existing global 6-digit code remains the admin/dev login; album passcodes become the student-facing credential. This avoids a rewrite while delivering the specified privacy model.

---

## 22. Deliverables, Constraints & Open Questions

**Requested from design and engineering**

- [ ] Hi-fi mobile + desktop mockups: landing, passcode modal, dashboard, viewer/editor, cart, checkout, confirmation, admin album upload, admin order queue.
- [ ] OpenAPI file committed at `docs/openapi.yaml` (generated from section 7).
- [ ] Database migration scripts alongside `backend/src/db/migrate.js`.
- [ ] Deployment plan: S3 + CDN + app servers, environment matrix, rollback.
- [ ] Test plan and automated suites (unit, integration, E2E).
- [ ] Admin manual and fulfilment runbook.

**Constraints / preferences (as built)**

- Stack: React + Vite, Node/Express, SQLite (dev/test) + PostgreSQL (prod), S3-compatible storage, PayFast (not Stripe — this is a South African merchant).
- Payments: PayFast merchant `10000100` / key `46f0cd694581a` in sandbox; production credentials from the university finance office.
- Legal: POPIA (South Africa) is the governing privacy regime; GDPR applies to any EU-resident alumni.

**Open questions**

1. Is per-student passcode issuance feasible from the photographer's existing data, or do we start with `single` mode per ceremony?
2. Print vendor: manual CSV export for launch, or an API integration with a specific lab?
3. Does the university want students to download originals, or print-only? Default is `allow_download = false`.
4. Who owns fulfilment — UKZN Communications or an external lab?
5. Retention: 24 months proposed; confirm against university records policy.
6. Is SSO via `sso.ukzn.ac.za` desired for admins in addition to code login?

**Two decisions needed before Week 1:** answers to (1) and (2).
