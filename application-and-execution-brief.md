# Stellar Payment Doctor: application and execution brief

> **Superseded budget and scope:** The current user-requested proposal is [Project details — $2,200](project-details-2200.md). This earlier $4,000 brief is retained as research and planning history; use the newer document for the funding request and deliverables.

Prepared 6 September 2026. Proposed request: **$4,000 for a 30-day sprint**. This is a project proposal, not an award offer or a completed official application. No implementation, outreach or submission has been performed.

## 1. Decision

**The underlying problem is real; broad demand for this particular new tool is not yet established.** Public evidence spans GitHub, Stellar Stack Exchange, Reddit, GalacticTalk and current Stellar operational documentation. Those sources differ substantially in age and strength. They do not establish a failure rate, market size, or committed adopters.

Proceed with validation of a **shared classic-payment readiness library, regression fixtures and a small integration example**, preferably as an agreed upstream contribution. Do not pitch a generic new payment debugger or claim that preflight tools do not exist.

My recommended threshold before committing the full sprint is: an SDK maintainer confirms a useful unowned contribution, two independent builders identify a current use case and agree to test it, and a Chapter Lead confirms the application route and applicant eligibility. These are project validation criteria I recommend, not official requirements for two pilot customers.

## 2. Evidence and its limits

| Source | Observed problem | What it establishes |
|---|---|---|
| [Official JS SDK issue #1601](https://github.com/stellar/js-stellar-sdk/issues/1601), opened 8 August 2026; open when checked | A contributor requests combined payment checks and reserve calculations. | A direct current contribution signal. No assigned owner appeared in the snapshot; availability and maintainer acceptance remain unconfirmed. The related epic is from the same author and is not a second independent customer. |
| [Stellar Disbursement Platform troubleshooting](https://developers.stellar.org/docs/platforms/stellar-disbursement-platform/admin-guide/troubleshooting), current documentation | Operators must handle funding, destination-account and trustline failures. | Present operational relevance; documentation supplies no incident frequency or commitment to adopt our package. |
| [Deen Bridge issue #43](https://github.com/Deen-Bridge/dnb-backend/issues/43), opened 21 July 2026, now closed | Missing recipient USDC trustlines obstructed a course-gifting workflow; claimable balances were proposed. | A recent independent integration problem. The closed issue is not an unresolved customer request, and claimable balances are a different product solution. |
| [Etherfuse integration build report](https://github.com/carstenjacobsen/ai-etherfuse-integration), dated 15 March 2026 | The prototype encountered asset trustline errors and added a trustline button. | Another builder encountered and locally addressed the issue. This is a prototype report, not production incident data. |
| [Stellar Stack Exchange: unexpected result codes](https://stellar.stackexchange.com/questions/5954/understanding-behavior-of-stellar-api-result-codes), older Q&A | A developer saw `op_no_trust` despite believing the necessary trustline existed. | Developers need clearer diagnosis, including asset identity. It does not demonstrate a current SDK defect. |
| [Stellar Stack Exchange: trust limit issue](https://stellar.stackexchange.com/questions/4203/trust-limit-issue), 23 July 2020 | A private-network payment encountered a receiving limit failure. | Historical evidence for recipient-capacity confusion, not recent mainnet demand. |
| [Reddit: Freighter wallet issue](https://www.reddit.com/r/Stellar/comments/1gex2rs/), 29 October 2024 | A user received a generic on-chain failure message. | Unclear errors frustrate users. The cause was not confirmed, so this is not proof of a particular trustline failure. |
| [Reddit: token trustline/reserve discussion](https://www.reddit.com/r/StellarCannaCoin/comments/16yjqah/), 3 October 2023 | A user reported success after adding XLM when token setup had failed. | Historical reserve confusion, adjacent to payments; trustline creation itself is outside the proposed first release. |
| [GalacticTalk: issuer and asset confusion](https://galactictalk.org/d/2456-issuer-does-not-reflect-the-asset-total-supply-in-stellar-expert), July 2020 | A developer needed help distinguishing issuer, distributor and trustline behavior. | Historical integration complexity. Multiple URLs into this discussion count as one thread. |

Research covered public indexed sources. It did not access private Discord/Slack discussions or produce reliable X-specific demand evidence. Searches are not an exhaustive survey. No users have been interviewed for this proposal.

## 3. Existing work changes our positioning

**Correction to the earlier recommendation:** the official SDK's `checkMemoRequired` method is already public. Applications can call it on an unsigned built transaction. We should reuse it; exposing memo checking is not a new contribution. Verified in [pinned SDK source](https://github.com/stellar/js-stellar-sdk/blob/63c85feb2ef3448f2c97ec3a42802d4c636d85a7/src/horizon/server.ts#L852).

| Existing implementation | Coverage observed | Consequence for this project |
|---|---|---|
| [Horizontal Systems' preflight helper](https://github.com/horizontalsystems/stellar-web-sdk/blob/6ab764896d3adac6c2f8c5622797a69ae456db4a/src/stellar/preflight.ts) | The inspected helper checks source/destination existence and the recipient's classic-asset trustline. | Basic preflight already exists. Its inspected function does not perform the combined reserve/liability/capacity calculations proposed here; that is not an audit of the whole package. |
| [Freighter reserve helper](https://github.com/stellar/freighter/blob/2d8876c508a4042e50430d71634db2ab74281a5f/extension/src/popup/helpers/xlmReserve.ts) | Reserve warnings and amount adjustments for swaps requiring a new trustline. | Established wallets already address parts of the problem. Offer reusable calculations and fixtures; do not claim to repair all wallets. |
| [LATAM Anchor Kit](https://github.com/ChatPay-Go-Labs-Oficial/rn-latam-anchor-kit) | Its README documents preflight for off-ramp trustlines, asset funds and XLM reserves/fees. | A closer integration-specific alternative. README behavior was reviewed, not runtime-tested. |
| [TrustBridge](https://github.com/Stellar-TrustBridge) | Its public profile describes payout-readiness checks for trustlines and XLM reserves. | Similar positioning already exists. Deployment and adoption claims were not independently verified. |
| [Stellar Transaction Visualizer award](https://communityfund.stellar.org/submissions/recsNbuj56ko8dhE6) | SCF funded transaction visualization/simulation/debugging through a $50,000 Build award. | A general transaction dashboard is an overlapping proposal; this award does not predict Instaward approval. |

The candidate gap is a consistent, reusable combination of **sponsorship-aware reserve math, liabilities, recipient capacity, authorization and understandable results**, with exact boundary tests and a straightforward JS/TS integration. Its additional value still needs a maintainer and prospective adopters to confirm it.

## 4. Application-ready project statement

**Working title:** Stellar Payment Doctor — Classic Payment Readiness Toolkit.

**Problem:** Stellar payment integrations must distinguish a displayed balance from an amount that can actually be sent, and check whether the receiving account can accept the exact asset. When these checks are incomplete, users reach signing or submission before receiving an opaque failure. Some applications already implement parts of this logic, which creates an opportunity to share well-tested calculations and diagnostics where teams still need them.

**Proposed solution:** An open-source TypeScript library that examines a supported payment before signing, calculates the relevant limits and returns a structured explanation with the next action and responsible party. A small reference interface demonstrates how a payment form can use the results. Work will target an agreed SDK contribution or companion package.

**Intended beneficiaries:** JS/TS developers integrating ordinary Stellar transfers, especially smaller payment apps and wallet integrations that would otherwise maintain these checks themselves. End users benefit through clearer amounts and instructions. Reduced failed attempts and support work are expected benefits to measure, not established outcomes.

## 5. Exactly what the first release will check

| Check | How we will implement it | Action the result will explain |
|---|---|---|
| Account and network readiness | Validate inputs; compare the provider's network identity; load both accounts. | Correct the address/network or activate a missing account through the application's normal onboarding flow. |
| Exact asset and trustlines | Match issued assets by both code and issuer; inspect sender and recipient trustlines. | The affected account must establish the correct trustline. Identically named assets are not interchangeable. |
| Authorization | Inspect authorization state for both relevant trustlines. | The issuer must authorize or restore access where required. The checker cannot grant authorization. |
| Spendable XLM | Calculate reserves from current network/account data, including sponsorship; subtract selling liabilities and the planned fee budget. | Show the available amount and shortfall. The user can lower the amount, fund the account or separately manage offers/reserves. |
| Spendable issued assets | Account for the sender's asset balance and selling liabilities; separately check XLM for reserves and fees. | Lower the payment amount, fund the asset/XLM balance, or separately release funds committed to offers. |
| Recipient capacity | Calculate remaining trustline capacity after balance and buying liabilities. | The recipient can adjust the limit or separately manage balances/offers. |
| Declared memo requirement | Reuse the SDK's existing memo-checking behavior and translate the result. | Supply the memo obtained from the receiving service when required. We cannot determine whether an arbitrary memo identifies the right exchange customer. |
| Unavailable or unsupported data | Track failed reads, malformed data and unsupported payment forms explicitly. | Return an incomplete assessment and explain what could not be checked. |

The protocol behaviors underlying these checks are documented in Stellar's [payment operation reference](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations). Memo declarations follow [SEP-29](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0029.md).

**What “fix” means here:** we fix missing checks and unclear explanations in the integration. The library does not alter protocol requirements or automatically move funds, establish trustlines, change offers, or authorize an asset.

### Supported boundary

One ordinary classic `Payment` operation between distinct, existing G-address accounts, using XLM or an issued asset. Transaction source, operation source and fee payer must be the same account. Missing accounts produce a diagnosis rather than an account-creation transaction. Issued-asset inputs require an explicit issuer.

The first release will identify and reject unsupported cases: Soroban/SAC transfers, M-addresses, federation resolution, fee bumps or separate operation sources, batches/multiple operations, path payments, self-payments, and transfers to/from the asset issuer. The last two need special treatment; applying ordinary trustline rules would misdiagnose them. Signing, submission, retry logic, recovery and automatic remediation are outside this sprint.

### Proposed design

1. Normalize the payment intent and validate its supported shape.
2. Read network/reserve metadata and source/destination account data through a Horizon adapter.
3. Feed normalized data to pure calculation/check functions; reuse SDK functionality where available.
4. Return a report with stable issue codes, explanation, recommended action and affected party.
5. Let the integrating application show those results before requesting a signature.

Reports use `no_known_issues`, `issues_found` or `incomplete`. Include checks performed, unresolved checks, observation times and available ledger information. Amounts remain decimal strings at the API boundary and integer stroops internally. A failed provider request must never become a clean result. A partial report may contain known issues while also being incomplete.

Arithmetic design, subject to protocol fixtures and maintainer review:

```text
reserve = (2 + subentries + sponsoring - sponsored) × current base reserve
available XLM = max(0, native balance - reserve - native selling liabilities - fee budget)
available issued asset = max(0, asset balance - asset selling liabilities)
recipient capacity = trustline limit - asset balance - buying liabilities
```

Use the live reserve parameter rather than a fixed XLM constant; see [sponsored-reserve accounting](https://developers.stellar.org/docs/build/guides/transactions/sponsored-reserves). Validate positive amounts, at most seven decimal places and protocol integer bounds. Reject missing or inconsistent accounting fields instead of guessing defaults.

Separate Horizon responses are not an atomic snapshot. A report only describes observed state, and fee budgeting does not guarantee inclusion. The integrating app should recheck when the payment changes or before final confirmation. This is an advisory tool, not a guarantee that a submitted transaction will succeed.

## 6. Deliverables and verification

The proposed funded outputs are a reusable library/contribution, a fixture suite, one small browser integration example, integration documentation and a release or review-ready upstream change. Upstream review/merge timing is outside our control; a grant milestone should not promise a merge by day 30.

Minimum fixture coverage is the following **28 case groups**, with additional boundary variants where necessary:

| # | Case | # | Case |
|---|---|---|---|
| 1 | Valid XLM payment | 15 | Native selling liabilities reduce availability |
| 2 | Valid issued-asset payment | 16 | Issued-asset selling liabilities reduce availability |
| 3 | Missing source account | 17 | Asset funds sufficient, XLM fee/reserve funds insufficient |
| 4 | Missing destination account | 18 | Recipient has exactly sufficient capacity |
| 5 | Sender lacks exact asset trustline | 19 | Recipient capacity short by one stroop |
| 6 | Recipient lacks exact asset trustline | 20 | Buying liabilities reduce recipient capacity |
| 7 | Same code, different issuer | 21 | Declared memo requirement without memo |
| 8 | Sender trustline not fully authorized | 22 | Declared requirement with supplied memo; no identity claim |
| 9 | Recipient trustline not fully authorized | 23 | No declaration; no inference about exchange requirements |
| 10 | Exact XLM availability including fee | 24 | Zero, negative, overprecision and out-of-range amounts |
| 11 | XLM shortfall of one stroop | 25 | Network mismatch |
| 12 | Subentries increase reserve | 26 | Timeout, rate limit and malformed account/provider data |
| 13 | Sponsoring increases reserve | 27 | Unsupported payment forms listed in the scope boundary |
| 14 | Sponsored entries reduce reserve; mixed sponsorship | 28 | Refresh after observed state changes; incomplete partial reads |

Add six reproducible testnet demonstrations: valid XLM transfer readiness, valid issued-asset readiness, missing recipient trustline, insufficient source availability, insufficient receiving capacity and missing declared memo. Protocol-level failure cases can be compared with deliberately submitted testnet transactions in a separate development harness; the public checker itself remains read-only.

Acceptance targets: all agreed fixtures pass; no fixture receives a clean report when a supported check should fail; required checks cannot silently disappear after provider errors; the example runs in a browser and the library in its documented Node environment; a developer outside the project can follow the integration guide. These are targets, not results already achieved.

Pilot evidence should record the real workflow, integration time, confusing/missing results and whether the developer intends to retain the integration. Only claim reductions in failed payments or support volume if a pilot supplies an actual baseline and comparison. Two interested developers are a validation target, not secured partners.

## 7. Thirty-day execution and proposed budget

The sprint starts on the date agreed with the Chapter/SDF, after validation and scope agreement. Chapter engagement and grant review are not assumed to fit inside these development days.

| Days | Work and reviewable output | Proposed allocation |
|---|---|---:|
| 1–5 | Finalize API, supported boundaries, source snapshots and fixture specification | $600 |
| 6–15 | Implement exact calculations, checks and Horizon adapter | $1,600 |
| 16–23 | Complete fixtures, testnet demonstrations and integration feedback | $1,000 |
| 24–30 | Finish reference interface, documentation, release and upstream review package | $800 |
| **Total** | **One defined sprint** | **$4,000** |

These allocations are our proposed work budget, not official grant tiers, guaranteed payment dates or negotiated disbursement tranches. Applicant availability, a repository owner and a realistic post-sprint maintenance commitment still need to be supplied. Prefer the upstream project's license/contribution conventions; otherwise choose and document a compatible open-source license before release.

## 8. Application route and remaining requirements

The [Instaward rules](https://stellar.gitbook.io/scf-handbook/scf-awards/instawards/official-rules) specify a Chapter-led route rather than a standard public application. Consistent engagement is required. Initial awards usually range from $1,000–$5,000, paid in XLM; scope and tier are agreed in advance. Sprints normally take at most 30 days. Submitted requests receive rolling review, typically in 3–5 business days. SDF decides approval, and KYC precedes disbursement. A current local nomination opportunity has not been confirmed.

The incorporated [general submission rules](https://stellar.gitbook.io/scf-handbook/scf-awards/official-rules-for-submissions) include age/jurisdiction eligibility and team/organization language. They also contain a two-representative clause framed around webinars, bootcamps and investor demo day. Ask the Chapter/SDF how that clause applies to an Instaward before representing a solo applicant as eligible. Do not assume incorporation is required or solo eligibility is established.

If the applicant is based in India, the [official India Chapter page](https://stellar.gitbook.io/ambassador-program/chapters/asia-pacific/india-chapter) lists **Sahitya Roy (Rise In)** as lead, with Discord **sahitya_roy** and the [Stellar Developers Discord](https://discord.com/invite/stellardev). The chapter joining form is not a grant application. Location is not yet confirmed.

Application sequence:

1. Fill the applicant fields below and identify the appropriate chapter.
2. Establish the required engagement and review this scope with the lead.
3. Obtain maintainer feedback and evidence from prospective adopters; narrow or change the contribution if it duplicates active work.
4. Agree the amount, sprint deliverables, start date, milestones and submission route with the chapter.
5. Adapt the project statement, evidence, timeline and budget to the actual submission questions provided.
6. Complete official eligibility/KYC steps through the official process when requested, and execute against the written award terms if approved.

| Applicant/application item | Current status |
|---|---|
| Applicant name, country/city, team structure and authorized representative | Needed |
| GitHub, portfolio and relevant completed work | Needed |
| Chapter membership and actual engagement history | Needed; do not invent attendance or endorsements |
| Thirty-day availability and maintenance owner | Needed |
| Maintainer agreement and overlap/ownership check | Pending |
| Two independent prospective integrations | Pending; no commitments secured |
| Chapter's current nomination capacity, tier and solo/team clarification | Pending |
| Project problem, proposed scope, checks, test plan, timeline and budget | Drafted in this document |
| Official application fields and submission link | To be supplied/confirmed through the chapter |

## 9. Prepared outreach drafts — not sent

### SDK maintainer

I'm evaluating an Instaward proposal related to #1601. The intended contribution is reusable classic-payment checks combining reserves/sponsorship, selling and buying liabilities, recipient capacity and authorization, with reproducible fixtures. I confirmed that `checkMemoRequired` is already public and would reuse it. I also found overlapping preflight helpers in other SDKs.

Is this combined gap still useful and available to contribute to? Would you prefer an upstream change or a companion package, and is there an existing owner or implementation we should coordinate with? The proposed first release handles one classic payment between ordinary G-address accounts; the attached brief defines its boundaries.

### Prospective pilot developer

I'm validating a small open-source Stellar payment-readiness library. Your project's public work suggests experience with payment/trustline integration, though I understand the reported issue may already be resolved.

Do you still maintain reserve, liability or recipient-capacity checks that a shared library could replace? If so, would you review the proposed API and try a testnet integration? A current example and feedback on existing alternatives would help us decide whether this contribution is worthwhile.

### Chapter Lead

I'm [name], based in [country/city]. My current involvement with the chapter is [accurate engagement history], and my development work is at [GitHub/portfolio]. I'm preparing a proposed $4,000, 30-day open-source contribution called Stellar Payment Doctor. It focuses on reusable classic-payment readiness calculations and diagnostics; the attached brief includes existing alternatives, evidence limitations and measurable deliverables.

Could you confirm the current Instaward nomination route and appropriate tier, the engagement expected before consideration, and how solo/team eligibility and the general two-representative clause apply here? I'd also appreciate feedback on the scope and any builders who might benefit from testing it.

## 10. Research record

Issue states were checked against GitHub API snapshots on 6 September 2026. Selected SDK/Freighter/Horizontal Systems source files were inspected at the pinned commits linked above. Repository READMEs were treated as project claims, not proof of deployed behavior. No competing package was runtime-audited, and absence from a bounded source search was not treated as proof of absence everywhere.

This brief supersedes the earlier recommendation wherever it suggested missing public memo support, insufficiently acknowledged existing preflight implementations, or implied validated demand for a new standalone tool. The next useful evidence is direct maintainer and adopter feedback, not more repetitions of old forum reports.
