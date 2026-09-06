# Payment Doctor product page and checker redesign

The user requested a comprehensive UI, landing page and hero improvement. Keep the existing local library and Vite application. The primary audience is Stellar application developers; the main action is trying the payment checker.

## Direction

A light, quietly technical interface with forest ink #173d31, primary green #24664f, mint #e5f2e9, paper #fafbf8, neutral ink #202a25 and muted #68756d. Manrope carries headlines and body text; IBM Plex Mono carries amounts, code and small technical labels. Use broad spacing in the landing sections and tighter structured grouping in the functional checker. Avoid a dark crypto dashboard or generic blue form.

The signature element is a payment checkup card in the hero, grounded in the library's controlled sample report. A dotted ledger plane and connected account markers explain source-to-destination checking. Users can toggle healthy/attention samples. Every example is identified as sample data.

## Structure

1. Header: product identity, anchor links to checks, playground and developers, prominent checker CTA, responsive navigation.
2. Hero: clear pre-signing value, two working CTAs, readable assurances and interactive sample checkup card.
3. Check overview: funding/reserves, exact trustlines/capacity, memo/network validity; no invented testimonials or adoption claims.
4. Playground: scenario pills, fixture/live selector, grouped payment inputs, advanced network/fee/memo controls, immediate fixture result, status and report/JSON view, copy report. Clear incomplete and stale states.
5. Developer section: copyable integration example with true local package-install instructions; supported shape and limitations.
6. FAQ and closing CTA/footer with real anchor destinations.

## Implementation

Keep all readiness arithmetic and provider code unchanged. Split the existing demo controller into form orchestration, report rendering, and landing-page interactions. Use native controls and DOM text nodes for user/provider text. Optional motion is brief and honors reduced-motion preferences. Hero sample controls never initiate network calls. Copy buttons have success/error feedback. Changing payment inputs clears old reports; pending reports for older inputs are ignored.

## Verification

Run existing 92 library tests, full typecheck and both builds. Browser-check navigation, hero sample controls, scenario selection, live settings, report tabs/copy, malformed input, stale report behavior, mobile menu and narrow layout. Reuse the existing local app; deployment is outside this UI task.
