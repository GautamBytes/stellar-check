# Fixture coverage

The numeric test-name prefixes map to the proposal’s 28 case groups. Additional named regressions cover fee floors, native overflow, memo bounds, inconsistent state, transport binding and mutable inputs.

| Group | Coverage                                                                                                | Test file                      |
| ----- | ------------------------------------------------------------------------------------------------------- | ------------------------------ |
| 1     | Valid XLM, exact decimal facts, JSON-safe output, complete coverage                                     | core.test.ts                   |
| 2     | Valid issued asset                                                                                      | core.test.ts                   |
| 3–4   | Source and destination missing                                                                          | core.test.ts                   |
| 5–6   | Sender and recipient trustline missing                                                                  | core.test.ts                   |
| 7     | Same code with different issuer                                                                         | core.test.ts                   |
| 8–9   | Sender/recipient unauthorized; maintain-liabilities flag both true/false                                | core.test.ts                   |
| 10–11 | Exact native availability and one-stroop shortfall including fee                                        | core.test.ts                   |
| 12–13 | Subentries and sponsoring increase reserve                                                              | core.test.ts                   |
| 14    | Fully sponsored account and mixed sponsoring/sponsored counts                                           | core.test.ts                   |
| 15–16 | Native and issued selling liabilities; issued exact/one-stroop boundary                                 | core.test.ts                   |
| 17    | Asset sufficient, XLM below reserve plus fee                                                            | core.test.ts                   |
| 18–20 | Exact capacity, one-stroop deficit and buying liabilities                                               | core.test.ts                   |
| 21–23 | Memo declaration missing memo, supplied presence only, no identity inference                            | core.test.ts; provider.test.ts |
| 24    | Invalid sign/precision/range, integer/exponent/whitespace inputs, max int64; fee and memo bounds        | core.test.ts                   |
| 25    | Wrong network stops account reads                                                                       | provider.test.ts               |
| 26    | HTTP 429/503, timeout/slow body, malformed JSON/ledger/account/memo data; real SDK helper               | provider.test.ts               |
| 27    | Self-payment, M/federation address, path/batch/fee-bump/separate sources, Soroban, issuer parties       | core.test.ts                   |
| 28    | Fresh changed balances, partial reads preserving known issues, malformed state/envelopes, mutable input | both                           |

Run `npm test`. All tests are deterministic, offline and read-only. Test public addresses are derived from deterministic seeds only in the test fixture generator; they must never be used for real funds. The browser fixture examples contain public addresses only and make no network requests in fixture mode.

The suite validates observable reports and independent arithmetic boundaries. It does not assert that reported readiness guarantees eventual transaction inclusion. Live scenario verification is separate; see testnet.md.
