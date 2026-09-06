# Documentation and reading experience

The user approved a landing-page rationale section and dedicated Docs page, prioritizing reading quality on desktop and phone in light/dark mode.

The landing page introduces why payment readiness needs account context and shows a missing-recipient-trustline example. Navigation links to Why, Playground and Docs. The Docs page covers purpose, specific problems, a controlled example, the read/assess/report flow, confidence and evidence, integration, ecosystem benefits, scope and primary references. Benefits are identified as intentions rather than measured adoption claims. Technical claims follow the local implementation and cited Stellar references.

Reading design: the existing Manrope/IBM Plex Mono identity, a constrained article column, 17px/30.6px desktop body text and 16px/29.6px phone body text. Desktop uses a sticky contents sidebar; narrow screens use a compact sticky disclosure menu. Source links and code-copy controls are real. Code overflow is contained; semantic themes cover the entire article. Print rules use readable light colors independently of the chosen screen theme. There is no decorative motion inside the article.

Implementation: docs.html and docs.ts provide a separate Vite build entry; reading.css scopes the reading and rationale sections. The Docs bundle does not load the payment SDK. Shared mobile navigation is extracted into navigation.ts. Whitelisted scenario query parameters let the example link open the actual offline trustline fixture in the playground.

Verification: typecheck, all 98 tests and the multipage production build pass. Chrome desktop/mobile checks cover both themes, contents links, copy actions, no page-wide overflow, theme persistence across pages, and the deep link into the controlled trustline scenario. All same-page Docs anchors resolve. A production preview verified the built Docs route, copy actions and the example link into the built homepage. A 320px phone viewport also had no page-wide overflow. Primary references include sponsored reserves, verifying trustlines, SEP-29 and Stellar's operation reference. No public deployment or outreach was performed.
