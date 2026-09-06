# Dedicated Playground

The user approved moving the full checker to its own page while keeping the small interactive homepage preview. Version remains v0.1.0 throughout pre-grant development.

The homepage introduces Stellar Check and links to `/playground.html`. Docs explains the report and links directly to the missing-trustline sample. The Playground keeps the existing calculation and provider behavior, with a compact introduction, active navigation and a report guide link. Desktop pairs form and report; phones stack them with full-width mode controls and a two-column sample selector. Existing pearl/violet and midnight/blue theme tokens carry across all pages, with the icon-only toggle.

Implementation separates homepage startup from checker startup and adds Playground to the multipage Vite build. Old `/#playground` bookmarks redirect to the new page and preserve only supported sample names. No redirects enable live mode or submit payments.

Verification: all 98 tests and production builds pass. Chrome checks cover desktop and 390px phone layouts in light/dark themes, no horizontal overflow, mobile navigation, homepage hero interaction, Docs sample links, stale report clearing, a submitted insufficient-XLM sample, report JSON and live-mode field visibility. Legacy sample bookmarks redirect correctly. Live requests were not repeated for this page move.
