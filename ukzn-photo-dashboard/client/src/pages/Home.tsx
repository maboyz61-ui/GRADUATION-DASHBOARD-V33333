import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight, Bell, CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Download, Eye, FileImage, Frame, Grid2X2, Heart, Images,
  LayoutDashboard, LoaderCircle, Menu, Search, Settings2, SlidersHorizontal,
  Share2, Sparkles, UserRound, WandSparkles, X, ZoomIn,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const baseGallery = [
  { title: "Formal portrait", category: "Individual", image: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=1100&q=88", span: "wide", views: 218 },
  { title: "Ceremony detail", category: "Candid", image: "https://images.unsplash.com/photo-1520857014576-2c4f4c972b57?auto=format&fit=crop&w=1100&q=88", span: "standard", views: 164 },
  { title: "Gown close-up", category: "Robing", image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1100&q=88", span: "standard", views: 121 },
  { title: "Campus portrait", category: "Individual", image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1100&q=88", span: "standard", views: 196 },
  { title: "Studio headshot", category: "Individual", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1100&q=88", span: "standard", views: 243 },
  { title: "Garden group", category: "Group", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=88", span: "wide", views: 184 },
] as const;
const gallery = Array.from({ length: 24 }, (_, index) => ({ ...baseGallery[index % baseGallery.length], id: index + 1, title: index < 6 ? baseGallery[index].title : `${baseGallery[index % baseGallery.length].title} ${Math.floor(index / 6) + 1}`, sequence: index + 1 }));
type Photo = (typeof gallery)[number];
type SortOption = "Newest first" | "Oldest first" | "Most viewed";
type Receipt = { orderId: string; date: string; items: string[]; total: number; delivery: string };
const navGroups = [
  { label: "Workspace", items: [{ label: "Overview", icon: LayoutDashboard }, { label: "Photos", icon: Images, count: "78" }, { label: "Events", icon: CalendarDays }, { label: "Grades & Designs", icon: WandSparkles }, { label: "Framing Mockups", icon: Frame }] },
  { label: "Account", items: [{ label: "Profile", icon: UserRound }, { label: "Settings", icon: Settings2 }, { label: "Help & Support", icon: CircleHelp }] },
];
const ease = [0.23, 1, 0.32, 1] as const;
const pageSize = 6;

function Stat({ label, value }: { label: string; value: string }) { return <div className="stat-block"><p className="eyebrow">{label}</p><div className="stat-value">{value}</div></div>; }
function AppLogo() { return <div className="brand-mark" aria-hidden="true"><span>UK</span></div>; }

export default function Home() {
  const [activeNav, setActiveNav] = useState("Photos");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => JSON.parse(localStorage.getItem("ukzn-photo-favorites") || "[]"));
  const [showFilters, setShowFilters] = useState(true);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [filter, setFilter] = useState(() => localStorage.getItem("ukzn-photo-filter") || "Individual");
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>(() => (localStorage.getItem("ukzn-photo-sort") as SortOption) || "Newest first");
  const [page, setPage] = useState(() => Number(localStorage.getItem("ukzn-photo-page") || "1"));
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [purchaseOpen, setPurchaseOpen] = useState(false);
  const [checkoutIds, setCheckoutIds] = useState<number[]>([]);
  const [paymentState, setPaymentState] = useState<"idle" | "processing" | "complete">("idle");
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [toast, setToast] = useState("");
  const [shareLabel, setShareLabel] = useState("Share");
  const lightboxRef = useRef<HTMLDivElement>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };
  useEffect(() => { localStorage.setItem("ukzn-photo-favorites", JSON.stringify(favoriteIds)); }, [favoriteIds]);
  useEffect(() => { localStorage.setItem("ukzn-photo-filter", filter); setPage(1); }, [filter]);
  useEffect(() => { localStorage.setItem("ukzn-photo-sort", sort); setPage(1); }, [sort]);
  useEffect(() => { localStorage.setItem("ukzn-photo-page", String(page)); }, [page]);
  useEffect(() => { document.body.style.overflow = lightboxPhoto || purchaseOpen ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [lightboxPhoto, purchaseOpen]);
  useEffect(() => {
    const sharedId = Number(new URLSearchParams(window.location.search).get("photo"));
    const sharedPhoto = gallery.find((photo) => photo.id === sharedId);
    if (sharedPhoto) { setFilter("All"); setLightboxPhoto(sharedPhoto); }
  }, []);
  useEffect(() => {
    const url = new URL(window.location.href);
    if (lightboxPhoto) url.searchParams.set("photo", String(lightboxPhoto.id)); else url.searchParams.delete("photo");
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  }, [lightboxPhoto]);
  useEffect(() => {
    if (!lightboxPhoto) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    lightboxCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setLightboxPhoto(null); return; }
      if (event.key === "ArrowLeft") { event.preventDefault(); moveLightbox(-1); return; }
      if (event.key === "ArrowRight") { event.preventDefault(); moveLightbox(1); return; }
      if (event.key === "Tab" && lightboxRef.current) {
        const focusable = Array.from(lightboxRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])'));
        if (!focusable.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previouslyFocused?.focus?.(); };
  }, [lightboxPhoto]);

  const filteredGallery = useMemo(() => {
    const filtered = filter === "All" ? gallery : filter === "Favorites" ? gallery.filter((photo) => favoriteIds.includes(photo.id)) : gallery.filter((photo) => photo.category === filter);
    return [...filtered].sort((a, b) => sort === "Most viewed" ? b.views - a.views : sort === "Oldest first" ? a.sequence - b.sequence : b.sequence - a.sequence);
  }, [filter, sort, favoriteIds]);
  const totalPages = Math.max(1, Math.ceil(filteredGallery.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const visiblePhotos = filteredGallery.slice((safePage - 1) * pageSize, safePage * pageSize);
  const selectedPhotos = gallery.filter((photo) => checkoutIds.includes(photo.id));
  const selectedTotal = selectedPhotos.length * 250;

  const toggleSelected = (id: number) => setSelectedIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const toggleFavorite = (id: number) => setFavoriteIds((ids) => ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]);
  const toggleSelectionMode = () => { setSelectionMode((value) => !value); if (selectionMode) setSelectedIds([]); };
  const selectAllVisible = () => { const visibleIds = visiblePhotos.map((photo) => photo.id); const everyVisibleSelected = visibleIds.every((id) => selectedIds.includes(id)); setSelectedIds((ids) => everyVisibleSelected ? ids.filter((id) => !visibleIds.includes(id)) : Array.from(new Set([...ids, ...visibleIds]))); };
  const openPhoto = (photo: Photo) => selectionMode ? toggleSelected(photo.id) : setLightboxPhoto(photo);
  const moveLightbox = (direction: number) => { if (!lightboxPhoto) return; const currentIndex = filteredGallery.findIndex((photo) => photo.id === lightboxPhoto.id); setLightboxPhoto(filteredGallery[(currentIndex + direction + filteredGallery.length) % filteredGallery.length]); };
  const handleDownload = () => { const photos = selectedIds.length ? gallery.filter((photo) => selectedIds.includes(photo.id)) : []; if (!photos.length) { notify("Select photos to download first"); return; } photos.forEach((photo, index) => window.setTimeout(() => { const link = document.createElement("a"); link.href = photo.image.replace("w=1100", "w=2400"); link.download = `${photo.title.toLowerCase().replaceAll(" ", "-")}.jpg`; link.target = "_blank"; link.rel = "noreferrer"; link.click(); }, index * 140)); notify(`${photos.length} high-resolution ${photos.length === 1 ? "photo" : "photos"} queued for download`); };
  const openCheckout = (ids: number[]) => { if (!ids.length) { notify("Select photos to purchase first"); return; } setCheckoutIds(ids); setPaymentState("idle"); setReceipt(null); setPurchaseOpen(true); };
  const sharePhoto = async () => {
    if (!lightboxPhoto) return;
    const url = `${window.location.origin}${window.location.pathname}?photo=${lightboxPhoto.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${lightboxPhoto.title} · UKZN Photo Portal`, text: "View this photo from my UKZN gallery", url });
      else { await navigator.clipboard.writeText(url); }
      setShareLabel("Copied"); notify("Photo link copied to clipboard"); window.setTimeout(() => setShareLabel("Share"), 1800);
    } catch { setShareLabel("Share"); }
  };
  const downloadReceiptPdf = (order: Receipt) => {
    const esc = (value: string) => value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    const lines = ["UKZN PHOTO PORTAL", "ORDER SUMMARY RECEIPT", `Order ID: ${order.orderId}`, `Date: ${order.date}`, `Delivery: ${order.delivery}`, "", "ITEMS", ...order.items.map((item, index) => `${index + 1}. ${item} - R250`), "", `TOTAL PAID: R${order.total.toLocaleString()}`, "Thank you for preserving your memories with UKZN Photo Portal."];
    const stream = ["BT", "/F1 12 Tf", "50 790 Td", ...lines.map((line, index) => `${index ? "0 -24 Td" : ""} (${esc(line)}) Tj`), "ET"].join("\n");
    const objects = [`1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj`, `2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj`, `3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj`, `4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`, `5 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj`];
    let pdf = "%PDF-1.4\n"; const offsets = [0]; objects.forEach((object) => { offsets.push(pdf.length); pdf += `${object}\n`; }); const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("")}trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" })); link.download = `${order.orderId}-receipt.pdf`; link.click(); URL.revokeObjectURL(link.href); notify("Receipt PDF downloaded");
  };
  const confirmPurchase = () => { setPaymentState("processing"); window.setTimeout(() => { const items = gallery.filter((photo) => checkoutIds.includes(photo.id)); setReceipt({ orderId: `UKZN-${Date.now().toString().slice(-8)}`, date: new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date()), items: items.map((photo) => photo.title), total: items.length * 250, delivery: "alex.mthembu@ukzn.ac.za" }); setPaymentState("complete"); setSelectedIds([]); setSelectionMode(false); }, 1500); };
  const goToPage = (nextPage: number) => setPage(Math.max(1, Math.min(totalPages, nextPage)));

  return <div className="app-shell">
    <AnimatePresence>{showMobileNav && <motion.button className="mobile-scrim" aria-label="Close navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowMobileNav(false)} />}</AnimatePresence>
    <aside className={`sidebar ${showMobileNav ? "sidebar-open" : ""}`}><div className="sidebar-top"><div className="brand"><AppLogo /><div><strong>UKZN</strong><span>Photo Portal</span></div></div><button className="icon-button sidebar-close" onClick={() => setShowMobileNav(false)} aria-label="Close navigation"><X size={18} /></button></div><nav className="sidebar-nav" aria-label="Primary navigation">{navGroups.map((group) => <div className="nav-group" key={group.label}><p className="nav-label">{group.label}</p><div className="nav-items">{group.items.map(({ label, icon: Icon, count }) => <button className={`nav-item ${activeNav === label ? "active" : ""}`} key={label} onClick={() => { setActiveNav(label); setShowMobileNav(false); if (label !== "Photos") notify(`${label} is coming soon`); }}><Icon size={17} strokeWidth={activeNav === label ? 2.25 : 1.8} /><span>{label}</span>{count && <em>{count}</em>}</button>)}</div></div>)}</nav><div className="sidebar-bottom"><div className="mini-profile"><div className="avatar avatar-student">AM</div><div><span>Welcome back,</span><strong>Alex Mthembu</strong></div><ChevronRight size={15} className="profile-arrow" /></div><div className="sidebar-footnote"><span className="status-dot" /> All systems operational</div></div></aside>
    <main className="main-content"><header className="topbar"><button className="icon-button mobile-menu" onClick={() => setShowMobileNav(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="breadcrumbs"><span>My dashboard</span><ChevronRight size={14} /><strong>Photos</strong></div><div className="topbar-actions"><button className="icon-button search-button" aria-label="Search" onClick={() => notify("Search is coming soon")}><Search size={18} /></button><button className="icon-button notification-button" aria-label="Notifications" onClick={() => notify("You’re all caught up")}><Bell size={18} /><span /></button><div className="topbar-avatar avatar avatar-student">AM</div><ChevronDown size={15} className="muted-icon" /></div></header>
      <div className="page-content"><motion.section className="hero-row" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5, ease }}><div className="title-block"><div className="overline"><Sparkles size={13} /> My dashboard</div><h1>My complete<br className="desktop-break" /> photo gallery</h1><div className="event-line"><span>UKZN · 2026-X898</span><span className="line-dot" /><span>Saturday, 12 Sep 2026</span></div></div><div className="stats-row"><Stat label="Ceremony date" value="May 12" /><Stat label="Photos total" value="78" /><Stat label="Purchased" value="4" /><Stat label="Wallet" value="R2500" /></div></motion.section>
        <section className="gallery-section"><div className="section-heading"><div><p className="eyebrow">Your collection</p><h2>Photo gallery <span>· {filteredGallery.length} matching images</span></h2></div><div className="toolbar"><button className={`toolbar-button ${selectionMode ? "button-selected" : ""}`} onClick={toggleSelectionMode}>{selectedIds.length ? <Check size={15} /> : <Grid2X2 size={15} />}{selectedIds.length ? `${selectedIds.length} selected` : selectionMode ? "Select photos" : "Select"}</button><div className="sort-wrap"><button className={`toolbar-button ${sortOpen ? "button-selected" : ""}`} onClick={() => setSortOpen((value) => !value)}><SlidersHorizontal size={15} /> Sort <ChevronDown size={14} /></button><AnimatePresence>{sortOpen && <motion.div className="sort-menu" initial={{ opacity: 0, y: -5, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -5 }}>{(["Newest first", "Oldest first", "Most viewed"] as SortOption[]).map((option) => <button key={option} onClick={() => { setSort(option); setSortOpen(false); notify(`Sorted by ${option.toLowerCase()}`); }}>{option}{sort === option && <Check size={14} />}</button>)}</motion.div>}</AnimatePresence></div><button className={`toolbar-button ${showFilters ? "button-selected" : ""}`} onClick={() => setShowFilters((value) => !value)}><SlidersHorizontal size={15} /> Filters</button></div></div>
          {selectionMode && <motion.div className="selection-toolbar" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}><button onClick={selectAllVisible}><Check size={14} /> {visiblePhotos.every((photo) => selectedIds.includes(photo.id)) ? "Clear visible" : "Select visible"}</button><span>{selectedIds.length ? `${selectedIds.length} selected across your gallery` : "Choose photos to download or purchase"}</span><button className="selection-close" onClick={toggleSelectionMode}><X size={14} /></button></motion.div>}
          <div className={`content-grid ${showFilters ? "with-filters" : "full-gallery"}`}><div className="gallery-column"><motion.div className="gallery-grid" layout>{visiblePhotos.map((photo, index) => { const isSelected = selectedIds.includes(photo.id); const isFavorite = favoriteIds.includes(photo.id); return <motion.button className={`photo-card ${photo.span === "wide" ? "photo-wide" : ""} ${isSelected ? "is-selected" : ""}`} key={photo.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .42, delay: index * .055, ease }} whileHover={{ y: -4 }} whileTap={{ scale: .985 }} onClick={() => openPhoto(photo)} aria-label={`${selectionMode ? "Select" : "Preview"} ${photo.title}`}><img src={photo.image} alt={photo.title} /><span className="photo-shade" /><span className="photo-meta"><span>{photo.title}</span><small>{photo.category}</small></span><span className={`photo-check ${isSelected ? "checked" : ""}`} onClick={(event) => { event.stopPropagation(); toggleSelected(photo.id); }}>{isSelected && <Check size={13} strokeWidth={3} />}</span><span className={`photo-favorite ${isFavorite ? "favorite-active" : ""}`} onClick={(event) => { event.stopPropagation(); toggleFavorite(photo.id); }} aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}><Heart size={14} fill={isFavorite ? "currentColor" : "none"} /></span><span className="photo-hover-action">{selectionMode ? <Check size={14} /> : <ZoomIn size={14} />}</span></motion.button>; })}</motion.div><div className="gallery-footer"><button className="pagination-arrow" aria-label="Previous page" disabled={safePage === 1} onClick={() => goToPage(safePage - 1)}><ChevronLeft size={16} /></button><div className="page-numbers">{Array.from({ length: totalPages }, (_, index) => index + 1).map((number) => <button key={number} className={safePage === number ? "page-active" : ""} onClick={() => goToPage(number)}>{number}</button>)}</div><button className="pagination-next" disabled={safePage === totalPages} onClick={() => goToPage(safePage + 1)}>Next <ChevronRight size={15} /></button><span className="footer-total">Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, filteredGallery.length)} of {filteredGallery.length}</span></div></div>
          <AnimatePresence initial={false}>{showFilters && <motion.aside className="filter-panel" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: .28, ease }}><div className="filter-header"><div><p className="eyebrow">Refine collection</p><h3>Advanced filters</h3></div><button className="icon-button" onClick={() => setShowFilters(false)} aria-label="Close filters"><X size={16} /></button></div><div className="filter-section"><p className="filter-label">My collection</p><div className="filter-options">{["All", "Favorites", "Individual", "Group", "Candid"].map((option) => <button key={option} className={filter === option ? "filter-active" : ""} onClick={() => setFilter(option)}><span>{option}{option === "Favorites" && favoriteIds.length > 0 ? ` · ${favoriteIds.length}` : ""}</span>{filter === option && <Check size={14} />}</button>)}</div></div><div className="filter-section"><p className="filter-label">Location</p><div className="filter-options compact">{["Stage", "Robing", "Campus"].map((option) => <button key={option} onClick={() => notify(`${option} filter selected`)}><span>{option}</span></button>)}</div></div><div className="filter-section"><p className="filter-label">Time block</p><div className="time-pills"><button className="time-active">All day</button><button onClick={() => notify("Morning filter selected")}>Morning</button><button onClick={() => notify("Afternoon filter selected")}>Afternoon</button></div></div><div className="filter-tip"><Heart size={16} /><div><strong>Favorites collection</strong><span>Save standout moments here for a later order.</span></div></div><button className="clear-button" onClick={() => { setFilter("All"); setSort("Newest first"); notify("Filters and sort reset"); }}>Clear all filters</button></motion.aside>}</AnimatePresence></div></section>
        <section className="quick-actions"><div className="quick-copy"><div className="quick-icon"><FileImage size={18} /></div><div><strong>{selectedIds.length ? `${selectedIds.length} photos ready` : `${favoriteIds.length} favorites saved`}</strong><span>{selectedIds.length ? "Download high-resolution files or create a print order." : "Choose your favourites to create a framed print or digital bundle."}</span></div></div><div className="quick-buttons"><button className="secondary-button" onClick={handleDownload}><Download size={15} /> Download {selectedIds.length ? "selected" : "bundle"}</button><button className="primary-button" onClick={() => openCheckout(selectedIds)}><Frame size={15} /> Buy selected <ArrowUpRight size={14} /></button></div></section>
      </div></main>

    <AnimatePresence>{lightboxPhoto && <motion.div className="lightbox-backdrop" role="dialog" aria-modal="true" aria-label="Photo preview" onClick={() => setLightboxPhoto(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="lightbox" ref={lightboxRef} initial={{ opacity: 0, scale: .96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: .96, y: 12 }} transition={{ duration: .25, ease }} onClick={(event) => event.stopPropagation()}><div className="lightbox-top"><div><p className="eyebrow">High-resolution preview</p><h3>{lightboxPhoto.title}</h3><small className="shortcut-hint">← → navigate · Esc close</small></div><button className="lightbox-close" ref={lightboxCloseRef} onClick={() => setLightboxPhoto(null)} aria-label="Close preview"><X size={19} /></button></div><div className="lightbox-stage"><button className="lightbox-nav lightbox-prev" onClick={() => moveLightbox(-1)} aria-label="Previous photo"><ChevronLeft size={22} /></button><img src={lightboxPhoto.image.replace("w=1100", "w=2400")} alt={lightboxPhoto.title} /><button className="lightbox-nav lightbox-next" onClick={() => moveLightbox(1)} aria-label="Next photo"><ChevronRight size={22} /></button></div><div className="lightbox-bottom"><div><span>{lightboxPhoto.category}</span><small>Photo {filteredGallery.findIndex((photo) => photo.id === lightboxPhoto.id) + 1} of {filteredGallery.length}</small></div><div className="lightbox-actions"><button className="secondary-button" onClick={() => toggleSelected(lightboxPhoto.id)}><Check size={15} /> {selectedIds.includes(lightboxPhoto.id) ? "Selected" : "Select photo"}</button><button className={`favorite-button ${favoriteIds.includes(lightboxPhoto.id) ? "favorite-active" : ""}`} onClick={() => toggleFavorite(lightboxPhoto.id)}><Heart size={15} fill={favoriteIds.includes(lightboxPhoto.id) ? "currentColor" : "none"} /> {favoriteIds.includes(lightboxPhoto.id) ? "Favorited" : "Favorite"}</button><button className="favorite-button" onClick={sharePhoto}><Share2 size={15} /> {shareLabel}</button><button className="primary-button" onClick={() => openCheckout(Array.from(new Set([...selectedIds, lightboxPhoto.id])))}><Frame size={15} /> Buy this photo</button></div></div></motion.div></motion.div>}</AnimatePresence>

    <AnimatePresence>{purchaseOpen && <motion.div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Purchase selected photos" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.div className="purchase-modal" initial={{ opacity: 0, y: 16, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: .25, ease }}>{paymentState === "processing" ? <div className="payment-processing"><LoaderCircle size={34} className="processing-spinner" /><p className="eyebrow">Secure payment</p><h3>Processing your order</h3><p>Confirming your payment and preparing your high-resolution files…</p><div className="processing-bar"><span /></div></div> : paymentState === "complete" && receipt ? <div className="receipt-view"><div className="success-check"><Check size={25} /></div><p className="eyebrow">Order confirmed</p><h3>Your receipt is ready.</h3><div className="receipt-card"><div><span>Order ID</span><strong>{receipt.orderId}</strong></div><div><span>Date</span><strong>{receipt.date}</strong></div><div><span>Delivery</span><strong>{receipt.delivery}</strong></div><div className="receipt-items"><span>Items</span>{receipt.items.map((item) => <p key={item}>{item}<b>R250</b></p>)}</div><div className="receipt-total"><span>Total paid</span><strong>R{receipt.total.toLocaleString()}</strong></div></div><button className="primary-button" onClick={() => setPurchaseOpen(false)}>Done</button></div> : <><div className="modal-header"><div><p className="eyebrow">Secure checkout</p><h3>Complete your order</h3></div><button className="icon-button" onClick={() => setPurchaseOpen(false)} aria-label="Close checkout"><X size={17} /></button></div><div className="order-summary"><div><span>{selectedPhotos.length} selected photo{selectedPhotos.length === 1 ? "" : "s"}</span><small>High-resolution digital files</small></div><strong>R{selectedTotal.toLocaleString()}</strong></div><div className="checkout-fields"><label>Delivery email<input value="alex.mthembu@ukzn.ac.za" readOnly /></label><label>Payment method<div className="payment-method"><span className="card-brand">VISA</span><span>•••• 4242</span><Check size={15} /></div></label></div><div className="wallet-note"><Sparkles size={15} /><span>Wallet balance <strong>R2500</strong> · remaining after purchase <strong>R{Math.max(0, 2500 - selectedTotal).toLocaleString()}</strong></span></div><div className="modal-actions"><button className="secondary-button" onClick={() => setPurchaseOpen(false)}>Cancel</button><button className="primary-button" onClick={confirmPurchase}>Pay R{selectedTotal.toLocaleString()}</button></div></>}</motion.div></motion.div>}</AnimatePresence>
    <AnimatePresence>{toast && <motion.div className="toast" initial={{ opacity: 0, y: 10, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: .2, ease }}><Check size={15} /> {toast}</motion.div>}</AnimatePresence>
  </div>;
}
