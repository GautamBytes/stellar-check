# UI redesign — 6 September 2026

The local Vite demo now includes a complete product landing page and redesigned payment playground.

## Changes

- Forest-green and mint palette, locally hosted Manrope and IBM Plex Mono fonts, custom brand mark and favicon.
- Large typographic hero with two functional CTAs and a sample report that switches between a valid native payment and a missing-trustline case using the library’s fixture assessments.
- Three original CSS illustrations explaining funds, exact trustlines and memo checks.
- Working playground with sample/live mode controls, four instant scenario buttons, grouped payment fields and expandable fee/memo settings.
- Overview/JSON tabs with keyboard support, copyable reports, visually separated amount/reserve facts and clear assessed/unresolved coverage.
- Loading, stale, malformed-input, provider-error and readiness states. Superseded asynchronous responses are discarded.
- Developer integration example with working copy control, honest local-package setup instructions, FAQs, closing CTA and responsive navigation.
- Reduced-motion support, visible focus rings, a skip link, mobile stacking and locally included font licenses.

The readiness library and its supported payment scope are unchanged. Amount bars use approximate proportions only for display; exact decimal facts and all readiness calculations remain in the library.

## Browser verification

Verified the hero issue toggle, all four scenario outcomes, switching to JSON, copying reports, clearing stale reports on input edits, invalid negative amounts, live Horizon native-payment readiness, integration copy and FAQ expansion. On the narrow viewport, the menu opens and closes when navigating, the form stacks, and document content width equals viewport width. Reviewed screenshots of the desktop hero, playground, mobile hero and mobile playground.

Run `npm run demo` and open http://127.0.0.1:5173/. The page is local; no deployment occurred as part of this redesign.
