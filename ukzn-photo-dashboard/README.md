# UKZN Photo Portal Dashboard

A polished React dashboard for browsing, curating, purchasing, and sharing graduation photography. The interface uses an Apple-inspired light workspace with deliberate spacing, soft depth, responsive composition, and restrained motion for a calm photo-management experience.

## Dashboard features

### Gallery and curation

The dashboard presents a responsive photo gallery with persistent filter, sort, and pagination state. Users can filter by collection type, including All Photos, Favorites, Individual, Group, and Candid, then sort by newest, oldest, or most viewed. Selection mode supports selecting visible photos or individual items across pages.

Favorites are saved locally so users can curate a personal collection for later review, download, or bulk purchase. Favorite controls are available directly on photo cards, in the lightbox, and through the Advanced Filters panel.

### Accessible lightbox preview

Selecting a photo opens a high-resolution preview with previous and next navigation. The lightbox supports Left and Right arrow shortcuts, Escape to close, visible focus states, focus trapping, focus restoration, and reduced-motion-friendly transitions. A direct `?photo=<id>` URL reopens a specific image and switches to the complete gallery context so its navigation position remains accurate.

The lightbox includes a Share action. Browsers with native sharing use the Web Share API; other browsers receive a clipboard copy fallback. Shared links can be opened directly by another user with access to the dashboard.

### Downloads, checkout, and receipts

Selected photos can be queued for high-resolution download. The purchase flow is currently a frontend simulation with a wallet balance summary, delivery email, selected item count, and calculated total. After the simulated payment processing animation completes, the dashboard creates a detailed itemized receipt containing the order ID, timestamp, delivery address, purchased photos, and total paid.

Receipts can be downloaded as client-generated PDF files without a server-side dependency. Payment processing, order persistence, protected image delivery, and production receipt storage should be connected to backend services before production use.

### Motion and accessibility details

Interactions use short, interruptible Framer Motion transitions with a preference for opacity and transform changes. Buttons provide active-state feedback, gallery items reveal progressively, and modal states avoid layout jumps. All interactive controls receive visible `:focus-visible` outlines, with higher-contrast focus treatment for photo cards. The implementation also respects `prefers-reduced-motion` for non-essential animations.

## Local development

Install dependencies with pnpm and start the Vite development server:

```bash
pnpm install
pnpm dev
```

The preview is available at `http://localhost:3000` by default.

## Verification

Run the same commands used by pull-request CI:

```bash
pnpm check
pnpm build
```

The project is frontend-focused and uses remote Unsplash image URLs for the demonstration gallery. The checkout and download flows are intentionally shaped as integration-ready frontend simulations.

## Project structure

The primary dashboard implementation lives in `client/src/pages/Home.tsx`, global tokens and responsive styling live in `client/src/index.css`, and the application shell is wired through `client/src/App.tsx`. The `server/` directory is retained for the template’s production build compatibility and is not part of the dashboard feature work.
