# Stellar Check: name and adaptive themes

The user requested a name directly related to the project and a complete dark mode. Stellar Check identifies the supported network and the payment-readiness check. The brand, icon, title, landing copy, integration example and local package now use this name. The package is stellar-check v0.1.0; it has not been published.

Light mode pairs pearl #fcfbfe and white surfaces with violet #6654c9, charcoal #242331 and muted text #696479. Dark mode pairs midnight #0c1220 and blue-slate surfaces #141e30 with ice blue #8bc6f6 and near-white #edf3ff. Success and warning states have separate semantic foreground/background pairs in each theme. Shared CSS tokens cover borders, controls, report cards and feature illustrations. Existing typography and responsive structure are retained.

The original glass-gate image is renamed demo/public/stellar-check-gates.png. Light mode retains its pearl and lilac appearance; dark mode uses a CSS filter and dark overlays to coordinate with the midnight palette. No additional image is downloaded. The original generation record is in the historical Preflight brand spec.

A header toggle is accessible on desktop and mobile. A small script runs before styles to apply a saved light/dark preference without a light-theme flash. Without an explicit preference it follows the system. Choices persist locally when storage is available; blocked storage falls back to the current session. System changes and cross-tab preference changes are handled. Theme changes do not touch payment or report state.

Verification: 98 passing tests, including six theme tests covering system changes, persistence, accessibility labels, blocked storage, invalid preferences and cross-tab updates. Desktop and 390px mobile Chrome review covered both palettes, hero, reports, menu and reload persistence. Typecheck and both production builds pass. No payment calculation or provider logic changed.
