# Graduation Dashboard Platform

This repository contains the existing graduation photography platform and the standalone UKZN Photo Portal dashboard workspace.

## UKZN Photo Portal dashboard

The `ukzn-photo-dashboard/` workspace contains a polished React dashboard for browsing, curating, purchasing, and sharing graduation photography. It uses an Apple-inspired light workspace with deliberate spacing, soft depth, responsive composition, and restrained motion.

### Dashboard capabilities

- Responsive photo gallery with persistent filtering, sorting, pagination, and selection mode.
- Persistent Favorites collection available from photo cards, the lightbox, and Advanced Filters.
- High-resolution lightbox preview with previous/next navigation, Left/Right arrow shortcuts, Escape dismissal, focus trapping, focus restoration, and visible keyboard focus indicators.
- Shareable `?photo=<id>` deep links with native Web Share API support and clipboard fallback.
- High-resolution bulk downloads and a frontend checkout flow with wallet balance and itemized totals.
- Simulated payment processing with detailed order receipts and client-generated downloadable PDF receipts.
- Reduced-motion-aware Framer Motion transitions and responsive mobile layouts.

The checkout and payment behavior is currently frontend-only and should be connected to the repository’s production order and payment services before deployment.

### Dashboard development

```bash
cd ukzn-photo-dashboard
pnpm install
pnpm dev
```

Validate the workspace with:

```bash
cd ukzn-photo-dashboard
pnpm check
pnpm build
```
