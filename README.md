# Beezie Claw — pull & reveal

A standalone rebuild of the [Beezie](https://beezie.com) digital claw machine flow: pick a machine, choose a quantity, pay, watch the reveal, then keep the graded collectible or swap it back instantly for a percentage of its market value.

Everything is mocked (wallet, inventory, RNG, payments). The point of the exercise is the **feel of the experience** and the **frontend engineering underneath it**: server rendering, a reveal video that never stalls, a testable state machine, and mobile-first polish including haptics.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
```

| Script                       | What it does                                                 |
| ---------------------------- | ------------------------------------------------------------ |
| `npm run dev`                | Next dev server (Turbopack)                                  |
| `npm run build && npm start` | Production build + server                                    |
| `npm test`                   | Vitest unit + component tests (95 tests)                     |
| `npm run typecheck`          | `next typegen` + strict `tsc --noEmit`                       |
| `npm run lint`               | ESLint 9 with `eslint-config-next` (React Compiler rules on) |
| `npm run check`              | typecheck → lint → test                                      |

### Testing on a real phone

```bash
npm run dev:lan          # binds 0.0.0.0, then open http://<your-lan-ip>:3000
```

Next 16 blocks dev-server requests from any origin other than `localhost`, so a phone on the same Wi-Fi gets the server-rendered HTML but **never hydrates** and nothing is tappable. `next.config.ts` therefore allow-lists this machine's LAN addresses via `allowedDevOrigins`. Restart the dev server after changing networks.

Requires Node ≥ 20.9. Promo codes to try: `BEEZIE10`, `CLAW20`, `WELCOME5`. The demo wallet starts at $2,500 and lives in a cookie, so clearing cookies resets it.

## What's in the box

| Surface                                                                   | Where                                  |
| ------------------------------------------------------------------------- | -------------------------------------- |
| Claw page (desktop + mobile), four routable machines                      | `/`, `/claw/[slug]`                    |
| Payment modal (centred dialog / bottom sheet)                             | `components/flow/PaymentModal.tsx`     |
| "Do not refresh" preparing state with "What you can pull" carousel        | `components/flow/PreparingModal.tsx`   |
| Fullscreen reveal video                                                   | `components/flow/RevealVideoLayer.tsx` |
| Single-item reveal                                                        | `components/flow/RevealSingle.tsx`     |
| Multi-item reveal: grid, multi-select, running total, 15-minute countdown | `components/flow/RevealMulti.tsx`      |
| Swap success                                                              | `components/flow/SwapSuccess.tsx`      |
| Top Items lightbox, Recent Pulls feed, odds table, sibling machines       | `components/claw/*`                    |

## Architecture

```
app/
  page.tsx, claw/[slug]/page.tsx   Server Components (dynamic SSR, streamed)
  actions.ts                       Server Actions: pullFromMachine · swapItems · applyPromo (zod-validated)
components/
  claw/                            Page sections – server components + small client islands
  flow/                            The pull flow (client) – overlay, modals, reveal screens, video layer
  ui/                              Button, Stepper, Segmented, RadioCard, Money (NumberFlow), Skeleton…
lib/
  domain/                          Pure, isomorphic logic: odds, draw, pricing, format, cookie codecs
  data/                            Mock catalog, machines, promos + server-only repository & card-art resolver
  video/preloader.ts               Blob preloader for the reveal clip (framework-agnostic external store)
  haptics/                         Semantic haptic events + cue runner for the video timeline
store/
  claw-flow.ts                     Pure reducer `transition(state, event)` + zustand store
  prefs.ts                         Sound / animation preferences (cookie-backed)
hooks/                             useRevealVideo, useHaptics, useCountdown, useMediaQuery
```

### Server vs client

"Use as much SSR as possible" was read literally: the entire page is rendered on the server and the client bundle only contains genuine interactivity.

| Server-rendered (no client JS)                                                                                                                    | Client islands                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header, footer, machine hero frame, machine details, price, odds table, tier chips, sibling machine links, Top Items grid data, Recent Pulls feed | Wallet chip (animated number), idle-video stage + Sound/Animation toggles, quantity stepper + CTA, promo code input, Top Items lightbox, and the pull flow overlay |

Data flow:

- **Mock data lives on the server** (`lib/data/*`, imported with `server-only`) behind async repository functions with small artificial latencies. Top Items and Recent Pulls are wrapped in `<Suspense>` so they **stream** after the above-the-fold HTML; you can see the skeletons on a cold load.
- **The route is dynamic on purpose.** `MachinePage` reads two cookies (`cc_prefs`, `cc_wallet`) so the very first HTML already carries the visitor's sound/animation preference and wallet balance – no hydration flash, no client fetch. `generateStaticParams` + `dynamicParams = false` act as the slug allow-list (`/claw/anything-else` → 404). Removing the two cookie reads would make the route prerender at build time with identical markup.
- **Mutations are Server Actions.** The pull result is decided on the server with a CSPRNG over the published odds; the swap credit is recomputed server-side from the stored pull, never trusted from the client. Because the actions write the wallet cookie, Next re-renders the route in the same round trip and the server-rendered header balance and Recent Pulls update with zero client wiring.
- `cacheComponents` (PPR) was intentionally left off: it changes the caching model and would require Suspense around every request-time read for a page that is already fully dynamic.

### The pull flow as a state machine

`store/claw-flow.ts` is a pure reducer, tested without React:

```
idle → payment → preparing → opening → reveal → swapping → swapped
```

`preparing → opening` only happens once **three** independent gates are in, in any order: the Server Action returned the pull, the reveal clip is fully buffered, and the minimum 4 s "Do not refresh" dwell has elapsed. Ignored events return the same state reference, so subscribers bail out cheaply.

### Reveal video preloading

`lib/video/preloader.ts` downloads the clip as a **Blob with byte-level progress** as soon as the page hydrates, hands the object URL to a single persistent `<video>` (mounted from hydration onwards, hidden until needed) and only reports `ready` once the element fires `canplaythrough`. At reveal time playback comes from memory.

- Portrait screens get the square clip, everything else the 16:9 one – chosen once per page load and never swapped after the element is activated.
- The "Do not refresh" bar blends the dwell timer (60 %) with the real download progress (40 %), so it cannot reach 100 % before the clip is ready.
- **iOS:** pressing _Confirm_ is the user gesture. Inside that click the element is played and immediately paused (`unlock`), which activates it so the later programmatic `play()` – with sound if the user opted in – is allowed.
- Failure modes are covered: fetch failure → fall back to streaming the file with `preload="auto"`; `canplaythrough` never firing → accept `readyState ≥ 3` after 8 s; clip stalls → a watchdog advances to the reveal after its duration; tab hidden → resume on return.

Verify it yourself: with the page loaded run `document.getElementById('reveal-video')` in DevTools – `readyState === 4` and `src` starts with `blob:` before you ever press Start Now. The Network panel shows one `reveal-*.mp4` request on load and none during the reveal.

### Haptics

`web-haptics` is used through a small semantic layer (`lib/haptics/events.ts`) for direct interface feedback: `tap`, `select`, `tick`, `confirm`, `error`, and `success`. Reveal-video playback does not schedule haptics.

| Platform         | Mechanism                                                         |
| ---------------- | ----------------------------------------------------------------- |
| Android Chrome   | `navigator.vibrate`, intensity emulated by PWM                    |
| iOS Safari 17.4+ | the `<input type="checkbox" switch>` trick (system switch haptic) |
| Desktop          | no-op; append `?haptics=debug` to hear an audible click per pulse |

### Value-first presentation

The interface presents card identity, market value, and swap decisions without rarity labels, tier colors, or outcome-dependent visual effects.

## Responsive notes

- Desktop: hero and details side by side, Top Items and Recent Pulls in the same viewport.
- Mobile: stacked layout, collapsible promo field, a fixed bottom bar with the stepper + CTA (safe-area aware), the payment modal becomes a drag-to-dismiss bottom sheet, the reveal grid drops to two columns and the square reveal clip is used.
- Overlays use `100dvh`, `viewport-fit=cover` and `env(safe-area-inset-*)`; the page behind the flow is made `inert` and scroll-locked.
- Audio is muted by default; the Sound toggle is shared between the idle loop and the reveal and persisted in a cookie.

## Testing

Vitest + jsdom + Testing Library. Per Next's own guidance async Server Components are not unit-testable, so the split is:

- **Pure logic** – odds normalisation and invariants, weighted draw (seeded, 20 000-sample distribution check), pricing/promo/swap maths, formatting, cookie codecs, the video preloader (mocked chunked fetch, fallback, timeout), the flow reducer (every guard, all six gate orders).
- **Server Actions** – with `next/headers` mocked: validation, insufficient funds, wallet debit/credit, swap of foreign/duplicate/expired items.
- **Components** – Stepper, PaymentModal, and RevealMulti (selection, totals, countdown with fake timers).

```bash
npm test
```

### End-to-end

Playwright starts a local Next development server and covers the purchase path on desktop and mobile: odds visibility, payment review dismissal, and the transition into preparation.

```bash
npx playwright install chromium # once per machine
npm run test:e2e
```

## Adding card artwork

Catalog ids are stable. Drop a photo at `public/cards/<catalog-id>.jpg` (or `.webp`/`.png`) and it is picked up on the next request – the server resolves artwork with a filesystem check, and items without a photo render a styled slab placeholder.

## Trade-offs and what's mocked

- Pulls and the recent-pulls feed live in server memory and reset on restart; the wallet is a cookie the user could edit. Both are documented mock behaviour – the shapes (`ActionResult`, `PullResult`, `SwapResult`) are what a real API would return.
- All four machines share the one idle clip and poster that were provided.
- The "Credit / Debit" tab is a placeholder for the Coinflow widget.
