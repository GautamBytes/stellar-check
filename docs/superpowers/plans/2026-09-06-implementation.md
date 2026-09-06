# Stellar Payment Doctor implementation plan

**Goal:** Implement the supplied $2,200 proposal as a local, reusable TypeScript package.
**Architecture:** A pure assessment engine consumes validated observations; a Horizon adapter fetches network metadata, accounts and the official SDK memo result. A single browser page and Node example call the same API.
**Tech stack:** TypeScript, official Stellar SDK, Node test runner via tsx, Vite for the reference page. Dependencies pinned in package.json and package-lock.json.

## Constraints and decisions

The user's instruction to start implementation authorizes this proposal's supported scope. Use the existing project folder; retain the original proposal documents. A standalone package is provisional pending any future upstream discussion. All public amounts are decimal strings, all arithmetic uses bigint stroops. One ordinary payment, distinct G accounts, same source/fee payer, native or issued assets excluding issuer parties. No signing or submitting in the library/demo. Unsupported or incomplete state cannot produce no_known_issues. Incomplete takes precedence while preserving known issues. Account observations are non-atomic; expose timestamps and available ledger information. Do not claim external validation or grant progress.

## Tasks

- [x] Core: define PaymentIntent, provider observations, diagnostic codes, coverage, facts and metadata in src/types.ts. Write test/core.test.ts fixtures for proposal groups 1–24 and 27–28. Verify red, implement input.ts, amounts.ts and assess.ts, then verify tests pass.
- [x] Provider: implement src/horizon.ts and src/check.ts. Fetch network passphrase and current ledger reserve/base fee, enforce network identity, validate complete relevant account fields, distinguish 404 from errors, preserve partial failures, bound requests with timeouts, and reuse SDK checkMemoRequired. Write test/provider.test.ts covering groups 25–26 and partial/change behavior; verify red then green.
- [x] Integration: export public types and functions from src/index.ts, document examples/check-payment.ts, create a plain responsive demo with public addresses, explicit network/Horizon, asset identity, amount, fee and memo. Discard reports when input changes and label fixture mode. Verify browser build and interactions.
- [x] Delivery: document all diagnostic meanings, acceptance fixture mapping, scope, observations, Node/browser usage, and four reproducible testnet scenarios. Add Apache-2.0 license. Run typecheck, tests, package build, demo build, Node example and npm pack dry run. Record executed verification and any remaining live testnet work.

## Validation cases

Native balance 10, reserve 1, fee 0.00001: amount 8.99999 passes; 8.9999901 fails by one stroop. Credit balance 100 with selling liabilities 90: amount 10 passes and 10.0000001 fails. Recipient limit 100, balance 95: amount 5 passes and 5.0000001 fails. Sponsoring and sponsored counts alter reserve units directly. Matching codes with different issuers never match. Authorization to maintain liabilities alone does not permit payments. Missing fields, wrong network, malformed provider responses, timeouts and rate limits always retain unresolved coverage. Memo success with a supplied memo establishes presence only. Recheck calls perform fresh reads.
