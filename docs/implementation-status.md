# Implementation status · 6 September 2026

The v0.1.0 implementation is available as **Stellar Check** (`stellar-check`) on [npm](https://www.npmjs.com/package/stellar-check), with the [public website](https://stellar-check-gamma.vercel.app) deployed on Vercel. It implements the technical scope of the supplied $2,200 proposal. The original proposal documents remain unchanged as planning records.

## Delivered

- TypeScript ESM library and declaration build, with `checkPayment`, `HorizonProvider`, `assessPayment` and public report/provider types.
- Exact seven-decimal bigint arithmetic, current ledger reserve/fee metadata, sponsorship and liability accounting, exact issuer trustlines, authorization, receiving capacity and SDK memo checks.
- Explicit input/scope validation, network mismatch handling, bounded HTTP reads, rate-limit/provider errors, partial results and runtime state validation.
- Fresh reads and copied payment inputs; incomplete status takes precedence without dropping known issues.
- Responsive Stellar Check website with original glass artwork, a redesigned landing page and browser demo with controlled fixtures and live Horizon modes, stale-report invalidation, observations, coverage and JSON reports.
- Node integration example, four live testnet scenario runner, fixture map, diagnostic guide, Apache-2.0 license and package metadata.

## Verification performed

| Check                  | Observed result                                                                                     |
| ---------------------- | --------------------------------------------------------------------------------------------------- |
| `npm run typecheck`    | Passed, including source, tests, demo and examples.                                                 |
| `npm test`             | 121 tests passed; 0 failures, 0 skipped. Covers all 28 proposal groups plus additional regressions.  |
| `npm run build`        | Passed; ESM output and TypeScript declarations.                                                     |
| `npm run demo:build`   | Passed; browser production bundle.                                                                  |
| `npm run example`      | Four offline scenarios returned the expected status/diagnostic patterns.                            |
| `npm run testnet`      | All four public testnet scenarios passed using read-only requests. No transactions submitted.       |
| `npm pack --dry-run`   | Package contents verified: built source/declarations, README, license and package metadata.         |
| Browser fixture checks | Valid XLM, valid credit, missing trustline and insufficient funds returned expected reports.        |
| Browser input update   | Editing a payment cleared the prior report.                                                         |
| Browser live testnet   | Native payment returned `no_known_issues` from current Horizon reads.                               |
| Narrow viewport        | Form stacked correctly; observed content width equaled viewport width, with no horizontal overflow. |

Full initial testnet reports are in [verification/testnet-2026-09-06.json](verification/testnet-2026-09-06.json). The live testnet runner’s current output is in `artifacts/testnet-results.json`. Historical reports are evidence of those observations, not a permanent readiness claim about the named accounts.

The fixture tests were introduced before the corresponding implementation and observed failing. Additional regressions reproduced mutable-input behavior, malformed provider envelopes, inconsistent account counters/ledgers and browser native-fetch binding before correction.

## Stellar Check website refresh

The active product name, local package metadata, integration snippet, page title and favicon now use Stellar Check. Coordinated pearl/violet light and midnight/ice-blue dark themes extend through the hero, feature illustrations, checker, developer section, FAQ and footer. Theme persistence, system preferences, accessible toggle states and blocked-storage fallback are covered by six dedicated tests. The generated hero asset and visual direction are documented in [the brand spec](superpowers/specs/2026-09-06-stellar-check-brand.md).

For v0.1.0, typecheck, all 98 tests and both production builds passed. Desktop and 390px mobile browser checks verified sample scenarios, stale-input clearing, invalid amounts, JSON export/copy, integration copy, navigation and FAQ expansion. No application console errors were observed; Chrome logged unrelated coupon-extension import failures. Long issuer addresses wrap in diagnostic actions. Existing live-testnet verification above predates this visual refresh; payment calculation and provider logic are unchanged.

## Navigation and motion refinement

The theme toggle is icon-only. A redesigned navbar groups links, highlights the current section and preserves accessible mobile navigation. Floating asset tokens and a sample payment-readiness path add hero motion, with pause/resume, offscreen suspension and reduced-motion support. Desktop and mobile Chrome checks and the full 98-test/build check passed. See [navigation and motion notes](superpowers/specs/2026-09-06-navigation-motion.md).

## Reading guide

The site now includes a “Why Stellar Check?” section and `/docs.html`. The guide explains purpose, supported problems, a controlled trustline example, report semantics, verification evidence, integration, intended ecosystem benefits, scope and primary references. It has a desktop contents sidebar, mobile contents menu, themed reading surfaces and copyable snippets. The example deep-links to the actual offline fixture. The production build emits Home, Docs and Playground and keeps the payment SDK out of the Docs entry. See [reading experience notes](superpowers/specs/2026-09-06-reading-experience.md).

## Remaining work

- Independent code review and integration feedback; no production audit has been performed.
- Repository owner: GautamBytes. Confirm whether ecosystem maintainers prefer an upstream contribution or companion package.
- Use project-maintained testnet accounts for longer-lived demonstrations; included public accounts can change/reset.
- Any upstream contribution remains a separate step from the published companion package.
- Obtain real maintainer/pilot feedback and complete the Chapter/grant process separately. No outreach, endorsements, funding approval or application submission is claimed.

Custom provider implementations must enforce their own I/O deadlines. Account observations remain non-atomic. Signatures, sequence numbers, transaction timing/preconditions, surge pricing, submission and finality remain outside the tool’s scope. No clean report guarantees transaction execution.

## Dedicated Playground (v0.1)

The full checker now lives at `/playground.html`. Home retains its interactive hero preview; navigation and Docs examples open the dedicated checker. Legacy `/#playground` bookmarks redirect and preserve supported sample selections. Home, Docs and Playground have separate browser entry points and production HTML outputs. The checker retains controlled samples, live provider configuration, stale-report clearing and JSON export. Phone controls use touch targets and 16px input text, with a stacked form/report layout and both themes.


## XDR import and actionable issues (v0.1)

`importPaymentXdr` is exported from the library. It decodes supported unsigned V1 payment envelopes locally, preserves exact values and returns explicit unassessed envelope context. Unsupported signed, legacy, fee-bump, muxed, extended-precondition and transaction-extension shapes are rejected. The Playground previews before loading, invalidates changed previews and makes no account reads until Check payment. Guided issue cards focus the relevant fields or copy exact asset details.

The suite now contains 121 tests, including 23 importer tests. Chrome verification covered decode/preview/load, invalid input, network-change invalidation, exact fee conversion, stale report clearing, amount and fee correction shortcuts, copyable trustline details, mobile layouts and both themes. The original XDR is never rebuilt, signed or submitted.

## Public release (v0.1.0)

The implementation was merged through [PR #1](https://github.com/GautamBytes/stellar-check/pull/1). Vercel deploys the public website from `main`, using `npm run demo:build` and `demo/dist`.

`stellar-check@0.1.0` was published to npm by `gautam09` under Apache-2.0. The registry archive integrity matched the verified 21-file release archive. A fresh install in a separate temporary project passed ESM import checks, all four offline diagnostic scenarios, provider orchestration, and valid/invalid XDR decoding. The pre-publication check passed all 121 tests, typechecking, and both production builds.

The README, homepage and reading guide now use public npm installation commands. This remains the pre-grant v0.1 release; publication does not imply an independent audit or confirmed ecosystem adoption.
