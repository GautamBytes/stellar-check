# Stellar Payment Doctor

## Complete project proposal — $2,200 Instaward request

**Prepared:** 6 September 2026  
**Requested funding:** $2,200 USD equivalent  
**Proposed duration:** 30 calendar days from the agreed sprint start  
**Project type:** Open-source developer tooling for Stellar payments  
**Primary deliverable:** A TypeScript payment-readiness library with tests, documentation and one simple demo page  
**Current stage:** Proposal; implementation and grant submission have not started

This is the current project proposal and replaces the earlier $4,000 scope. The budget is our requested amount, subject to the Chapter/SDF agreeing an available tier and scope. Research findings below were checked on 6 September 2026. Applicant details, maintainer interest and pilot participation remain unconfirmed.

## 1. Project in plain language

Stellar Payment Doctor will help an application answer this question before asking a user to sign a payment:

> Based on the account information available now, what could stop this payment, and what does the affected person need to change?

A developer adds the library to a payment form. The library checks the proposed transfer, calculates relevant balances and limits, and returns understandable results. The application can then explain a problem before the user encounters a failed transaction.

For example, it could report that the recipient has not configured their account to receive the exact asset, or that part of the sender's XLM balance must remain reserved and cannot be sent.

The main product is reusable code. The demo page shows how to use it. We are proposing a focused contribution that other Stellar applications can integrate.

## 2. The problem we are solving

An account's displayed balance does not always equal the amount available for a payment. Similarly, having a valid recipient address does not mean that account can accept a particular asset or amount.

Applications need to account for several conditions together:

- Some XLM must remain reserved to support the account and its entries.
- Offers can commit funds or receiving capacity.
- Issued assets have an identity consisting of both an asset code and an issuer.
- Sender and recipient trustlines can be missing, limited or unauthorized.
- A destination may declare that it requires a memo.
- A provider may return incomplete data or be connected to a different network.

The relevant behavior is documented in Stellar's [operation reference](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations), [sponsored-reserve guide](https://developers.stellar.org/docs/build/guides/transactions/sponsored-reserves) and [memo-requirement specification](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0029.md).

The integration problem is combining the supported checks correctly and explaining the result. A generic error often leaves users unsure whether they need to change an amount, contact the recipient, add funds or request issuer authorization.

### A short glossary

| Term | Meaning in this project |
|---|---|
| Classic payment | An ordinary Stellar payment operation, without invoking a Soroban smart contract. |
| Trustline | An account entry for holding a specific issued asset, including a limit and authorization state. |
| Reserve | XLM that must support account entries and is not ordinarily available to send. |
| Sponsorship | An arrangement that changes which account supplies reserve requirements. |
| Selling liabilities | Amounts committed through outstanding sell offers. |
| Buying liabilities | Amounts that outstanding buy offers may receive, consuming capacity. |
| Preflight/readiness check | An assessment before signing; it does not execute the payment. |

## 3. Evidence that the problem exists

| Evidence | What it supports | Limitation |
|---|---|---|
| [Official JavaScript SDK issue #1601](https://github.com/stellar/js-stellar-sdk/issues/1601), opened August 2026 and open when checked | A contributor specifically requests combined payment checks and reserve calculations. | One direct request; maintainer acceptance and available contribution scope are unconfirmed. |
| [Stellar Disbursement Platform troubleshooting](https://developers.stellar.org/docs/platforms/stellar-disbursement-platform/admin-guide/troubleshooting) | Funding, account and trustline conditions matter in a current Stellar payment product. | Documentation does not establish incident frequency. |
| [Etherfuse integration build report](https://github.com/carstenjacobsen/ai-etherfuse-integration), March 2026 | An independent builder encountered trustline errors and added a local solution. | A prototype report; the reported problem was addressed locally. |
| [Stellar Stack Exchange developer question](https://stellar.stackexchange.com/questions/5954/understanding-behavior-of-stellar-api-result-codes) | Trustline-related result codes can confuse developers. | Older evidence, not proof of a current SDK defect. |
| [Reddit payment-failure discussion](https://www.reddit.com/r/Stellar/comments/1gex2rs/), October 2024 | Users struggle with unclear failure messages. | The underlying cause was not confirmed. |

**Conclusion:** the technical problem is supported by independent evidence. Broad demand for this specific new package has not been demonstrated. No pilot teams, customer numbers, endorsements or failure-reduction percentages should be claimed in the application.

Before committing the full sprint, our recommended validation is a maintainer confirming the useful contribution boundary and two independent developers identifying a current workflow they would test. These are our project-selection criteria, not official grant requirements.

## 4. Existing tools and our proposed contribution

We should explicitly acknowledge existing solutions:

- The official SDK already has a public `checkMemoRequired` method. We will reuse it rather than claim memo validation is new. [Inspected SDK source](https://github.com/stellar/js-stellar-sdk/blob/63c85feb2ef3448f2c97ec3a42802d4c636d85a7/src/horizon/server.ts#L852)
- Horizontal Systems has a helper checking account existence and recipient trustlines. [Inspected helper](https://github.com/horizontalsystems/stellar-web-sdk/blob/6ab764896d3adac6c2f8c5622797a69ae456db4a/src/stellar/preflight.ts)
- Freighter already implements some reserve warnings and amount adjustments. [Inspected reserve helper](https://github.com/stellar/freighter/blob/2d8876c508a4042e50430d71634db2ab74281a5f/extension/src/popup/helpers/xlmReserve.ts)
- LATAM Anchor Kit documents preflight for its off-ramp flow. This was observed in its README, not verified through runtime testing. [Project repository](https://github.com/ChatPay-Go-Labs-Oficial/rn-latam-anchor-kit)

The proposed additional contribution is **one reusable assessment combining reserves, sponsorship, liabilities, recipient capacity, authorization and clear results, backed by boundary tests**. It is aimed at integrations that still need this combination.

The maintainer discussion should decide whether to contribute directly to the official SDK or publish an agreed companion package. If active work already covers the gap, we should contribute missing tests or narrow the scope with the Chapter before submitting. The application must not promise to replace established wallets or claim that no competing implementation exists.

## 5. Who will use it and why it benefits Stellar

**Primary users:** JavaScript/TypeScript developers building payment forms, payout interfaces, wallet integrations or other applications that prepare ordinary Stellar transfers.

**Secondary beneficiaries:** People using those applications, who receive clearer explanations and more accurate available-amount information.

The expected ecosystem benefit comes from developers sharing tested calculations instead of independently reconstructing them. Successful adoption could reduce avoidable failed attempts and support work. Those outcomes need to be measured in actual integrations; the grant proposal should present them as intended benefits.

A new wallet, token or smart contract is not required for this contribution. The project uses Stellar account and payment data directly.

## 6. Exact scope for the $2,200 request

### Supported payment shape

- One ordinary classic `Payment` operation.
- Standard G-address source and destination accounts, with distinct addresses.
- XLM or a classic issued asset identified by code and issuer.
- The transaction source, operation source and fee payer are the same account.
- An explicitly chosen network and Horizon provider.
- A supplied payment amount, planned total fee budget and optional memo.

Missing accounts will be diagnosed. The tool will not create them. For issued assets, payments involving the issuer as sender or recipient are outside the first release because ordinary trustline assumptions do not apply to those cases.

### Checks and resulting guidance

| Check | What the library examines | What the application can explain |
|---|---|---|
| Valid input and network | Addresses, payment shape, amount format and provider network identity | Correct the input or provider configuration. |
| Account existence | Source and destination account responses | The missing account needs to be activated through the application's normal onboarding flow. |
| Exact asset trustlines | Relevant entries on both accounts, matched by code and issuer | Which account lacks the required trustline. |
| Authorization | Whether relevant trustlines permit the transfer | Issuer action is required where authorization is missing. |
| Available XLM | Balance, reserve accounting, selling liabilities and planned fee | Available amount, required amount and any shortfall. |
| Available issued asset | Asset balance and selling liabilities, plus separate XLM funding requirements | Whether asset funds or XLM funds are insufficient. |
| Recipient capacity | Trustline limit, current balance and buying liabilities | The recipient needs additional capacity before receiving this amount. |
| Declared memo requirement | SDK memo-checking result | A memo from the receiving service is required where declared. |
| Incomplete assessment | Failed reads, malformed state and unsupported inputs | Which checks could not be completed. |

**What we fix:** missing integration checks, incorrect available-amount calculations within the supported scope, and unclear explanations.

**What requires another actor:** adding funds, creating trustlines, managing offers, changing limits or granting authorization. The library explains these actions but does not perform them.

### Excluded from the funded first release

Soroban/SAC transfers, M-addresses, federation resolution, swaps/path payments, batches, multiple operations, fee bumps, separate operation sources, self-payments and payments involving an asset issuer as a party.

There is also no wallet connection, signing, payment submission, automatic retry, account recovery, automatic remediation, hosted API, user-account system or analytics dashboard. Unsupported payment forms receive an explicit incomplete/unsupported result.

### How the smaller budget changes delivery

The funded product is the library plus a single plain demo page. We retain the calculation and boundary tests because correctness is the purpose of the project. We reduce live demonstrations to four testnet scenarios, keep one documented integration example and make external pilot feedback a validation target rather than a guaranteed production integration deliverable.

## 7. What a developer and user will experience

### Integration flow

1. The application collects the payment details.
2. It calls the readiness library before requesting a signature.
3. The library validates the supported shape and loads the required public data.
4. It calculates limits and combines the checks into a report.
5. The application shows relevant explanations and actions.
6. After any correction, the application checks the updated payment again.

Signing and submission remain the responsibility of the integrating application.

### Example results

**Recipient missing a trustline:** “The recipient cannot currently receive this asset. They need a trustline for this asset code and issuer.”

**Amount exceeds available funds:** “Part of your XLM balance is reserved or committed to offers. The requested amount exceeds the amount available after the planned fee.” The interface also shows the calculated values.

**Receiving limit reached:** “The recipient does not have enough remaining trustline capacity for this amount.”

**Provider unavailable:** “The check could not be completed because account data was unavailable. No readiness conclusion has been reached.”

These are proposed messages, not outputs from an implemented product.

### Demo page

One page contains source/destination public addresses, network, asset, amount, fee budget and optional memo fields. A **Check payment** button displays the report, affected party, action and observation time. Included testnet examples make the behavior easy to review.

The demo does not request private keys or connect to a wallet. Account data is read from the configured provider. No application database or analytics collection is needed. Provider requests still reveal the queried addresses to that provider.

## 8. Technical implementation plan

### Proposed components

| Component | Responsibility |
|---|---|
| Input validator | Enforce the supported payment shape and exact amount formats. |
| Horizon adapter | Retrieve network/reserve metadata and account data; distinguish missing accounts from provider errors. |
| Calculation module | Calculate reserves, available funds and receiving capacity using exact integer arithmetic. |
| Diagnostic module | Turn supported conditions into stable codes, explanations and actions. |
| Report builder | Combine results and identify incomplete checks and observation metadata. |
| Reference page | Demonstrate how a payment form consumes the report. |

Use TypeScript and the official Stellar SDK. Keep calculations independent of network calls so they can be tested with controlled fixtures. Follow an upstream repository's tooling if contributing there; otherwise use a small conventional package/test setup. Exact dependency versions will be pinned when implementation starts.

### Proposed input and output contract

The input represents an unsigned payment intent: network/provider configuration, source, destination, asset, amount, total fee budget and optional memo. The library derives account state itself through the adapter.

The report includes:

- **Status:** `no_known_issues`, `issues_found` or `incomplete`.
- **Issues:** stable project-defined codes, affected party, explanation and recommended action.
- **Calculated facts:** available amounts, reserve requirements and receiving capacity where relevant.
- **Coverage:** checks completed and checks unresolved or unsupported.
- **Observation metadata:** network, fetch times and available ledger information.

If a required check is incomplete, the overall status is `incomplete`, even if other known issues are included. A provider failure must never silently become a clean result. Project diagnostic codes will be documented separately from Stellar's official transaction result codes.

### Arithmetic and precision

The proposed calculations for supported cases are:

```text
reserve = (2 + subentries + sponsoring - sponsored) × current base reserve
available XLM = max(0, native balance - reserve - native selling liabilities - fee budget)
available issued asset = max(0, asset balance - asset selling liabilities)
remaining receiving capacity = trustline limit - asset balance - buying liabilities
```

The reserve formula follows Stellar's [sponsorship accounting](https://developers.stellar.org/docs/build/guides/transactions/sponsored-reserves). Use current network values rather than a fixed reserve constant. Use integer units internally, with seven-decimal fixed precision, and decimal strings at API boundaries. Reject negative/zero payment amounts, excess precision and values outside protocol bounds. Missing or inconsistent state must not be replaced with invented defaults.

Reuse the SDK's existing memo API, translating its result into our report. It can identify a declared requirement but cannot establish that a supplied memo identifies the intended exchange customer.

### Reliability boundary

Separate account reads are not an atomic snapshot. Balances, offers and limits can change after checking. The application should recheck changed payments and refresh before confirmation. A clean report means no supported issue was found in the observed data, not guaranteed transaction success. Signature validity, sequence handling, submission and finality are not assessed by this tool.

## 9. Deliverables and acceptance criteria

| Deliverable | What will be available at completion |
|---|---|
| Reusable implementation | A versioned open-source package/release artifact or review-ready upstream contribution containing the agreed checks. |
| Automated verification | Fixtures covering the 28 case groups below, with documented boundary variants. |
| Testnet examples | Four reproducible readiness scenarios and their expected reports. |
| Reference interface | One locally runnable page using the same library. |
| Documentation | Setup, integration example, diagnostic meanings, supported scope and limitations. |
| Completion report | Deliverable links, verification results, feedback actually received and remaining limitations. |

Upstream merge timing and external developer availability are outside our control. Agree milestones around reviewable deliverables, not guaranteed maintainer merges or production adoption.

### Required fixture groups

| # | Case | # | Case |
|---|---|---|---|
| 1 | Valid XLM payment | 15 | Native selling liabilities reduce available funds |
| 2 | Valid issued-asset payment | 16 | Issued-asset selling liabilities reduce available funds |
| 3 | Missing source account | 17 | Asset funds sufficient but XLM funding insufficient |
| 4 | Missing destination account | 18 | Exactly sufficient receiving capacity |
| 5 | Missing sender trustline | 19 | Receiving capacity short by one smallest unit |
| 6 | Missing recipient trustline | 20 | Buying liabilities reduce receiving capacity |
| 7 | Matching asset code but different issuer | 21 | Declared memo requirement without memo |
| 8 | Sender trustline authorization insufficient | 22 | Supplied memo satisfies presence check only |
| 9 | Recipient trustline authorization insufficient | 23 | No memo declaration; no exchange-identity inference |
| 10 | Exactly sufficient XLM including fee | 24 | Invalid amount sign, precision and range |
| 11 | XLM shortfall of one smallest unit | 25 | Provider/network mismatch |
| 12 | Subentries increase reserves | 26 | Provider timeout, rate limit and malformed data |
| 13 | Sponsoring increases reserves | 27 | Unsupported payment shapes |
| 14 | Sponsored and mixed-sponsorship accounting | 28 | Changed state and incomplete partial reads |

The **four testnet scenarios** are a valid XLM payment, a valid issued-asset payment, a missing recipient trustline and insufficient source availability. More complex capacity, liability, sponsorship and memo cases remain mandatory in controlled fixtures.

All agreed tests must pass. Supported failure fixtures must not receive a clean result. Documentation must match actual behavior, and the example must run in a browser alongside documented Node usage. These are future acceptance criteria; no implementation tests have been run at this proposal stage.

## 10. Thirty-day schedule and $2,200 budget

The planning assumption is **88 hours of work at an average $25/hour allocation**, spread across 30 calendar days. This is an effort estimate for the proposal, not an official grant rate. Actual applicant availability must be confirmed.

| Period | Work | Estimated hours | Allocation |
|---|---|---:|---:|
| Days 1–4 | Finalize contribution boundary, report contract and fixture specification | 8 | $200 |
| Days 5–17 | Implement input validation, adapter, calculations and diagnostic reports | 40 | $1,000 |
| Days 18–24 | Complete automated cases, four testnet scenarios and identified corrections | 24 | $600 |
| Days 25–28 | Finish demo page, integration guide and release/review package | 16 | $400 |
| Days 29–30 | Calendar buffer and final handoff; redistribute the above effort if needed | 0 additional | $0 additional |
| **Total** | **One scoped sprint** | **88** | **$2,200** |

The funding is allocated to development and documentation. No paid infrastructure, mainnet transaction spending, marketing campaign or token issuance is included. The demo can be reviewed locally; public hosting is optional and not a funded dependency.

These allocations are not payment tranches. Any disbursement milestones and dates must be agreed through the award process. Chapter engagement, application review and approval are separate from the development calendar. The sprint start should be agreed explicitly.

## 11. Validation, ownership and maintenance

Before submission, ask the SDK maintainer whether the combined scope is useful, whether someone already owns it, and where the work should live. Seek two prospective developers who can explain an existing need and review the proposed interface. Record real responses rather than implying interest from an old public issue.

During the sprint, measure correctness against the agreed fixtures and collect any available integration feedback. Useful adoption evidence includes a developer completing the example, identifying code the library could replace, or choosing to retain an integration. Do not invent network-wide transaction-growth or failure-reduction targets.

The applicant will need to name a repository owner. Proposed license for a standalone package: Apache-2.0, with required attribution for reused work; an upstream contribution follows that repository's rules. Sprint-related corrections are covered within the budget. A longer maintenance commitment must be specified separately rather than implied as unlimited support.

## 12. Grant application requirements

The [Instaward rules](https://stellar.gitbook.io/scf-handbook/scf-awards/instawards/official-rules) describe a Chapter-led route with consistent engagement. Initial awards usually fall between $1,000 and $5,000, paid in XLM, with scope and amount agreed in advance. Work normally fits within 30 days. Review is rolling and typically takes 3–5 business days after submission; KYC precedes payment. A $2,200 request is not confirmation that this exact tier is available locally.

The incorporated [general rules](https://stellar.gitbook.io/scf-handbook/scf-awards/official-rules-for-submissions) contain eligibility and team/organization conditions, including a two-representative clause concerning program activities. The Chapter/SDF needs to clarify its applicability to this Instaward and any solo application. Applicant eligibility and a current nomination opportunity are not confirmed by this document.

If the applicant is based in India, the [India Chapter page](https://stellar.gitbook.io/ambassador-program/chapters/asia-pacific/india-chapter) lists Sahitya Roy of Rise In as lead, with Discord handle `sahitya_roy`. The appropriate chapter depends on the applicant's confirmed location.

### Information to supply before submitting

| Item | Status |
|---|---|
| Applicant name, country/city and team structure | Needed |
| GitHub, portfolio and relevant completed work | Needed |
| Actual Chapter engagement history and contact | Needed |
| Sprint availability and repository owner | Needed |
| Maintainer scope/ownership feedback | Pending |
| Prospective developer validation | Pending |
| Chapter confirmation of route, amount and eligibility | Pending |
| Project scope, budget, deliverables and test plan | Drafted here |
| Official form and any additional required fields | Obtain through the Chapter |

This document is a project brief that can be adapted to the actual application fields. It is not an official application template.

## 13. Proposal text to adapt for the application

### Project summary

Stellar Payment Doctor is a proposed open-source TypeScript library for checking ordinary Stellar payments before signing. It will combine available-balance calculations, reserve and liability accounting, recipient trustline and capacity checks, authorization checks and the SDK's existing memo validation into a structured report. Applications can use the report to explain what needs to change and who needs to act. The requested $2,200 will support a 30-day sprint delivering the reusable implementation, automated fixtures, four testnet examples, one simple demo page and integration documentation.

### Why this work matters

Public developer requests and Stellar's operational guidance show that funding, trustline and account-readiness conditions are recurring integration concerns. Existing wallets and SDKs already address parts of the problem. This proposal focuses on a shared combination of checks and reproducible tests for applications that still need it. We intend to validate that contribution boundary with maintainers and prospective integrators before committing the funded scope. Broad adoption and reduced failure rates have not yet been demonstrated.

### Scope and success criteria

The first release supports one classic payment between ordinary G-address accounts, using XLM or an issued asset, with one source/fee payer. Completion will be demonstrated through the agreed implementation, passing fixtures covering 28 case groups, four reproducible testnet scenarios, a runnable example and accurate documentation. Unsupported or incomplete checks will be reported explicitly. The project will not sign transactions, move funds or guarantee payment execution.

### Funding request

We request $2,200 USD equivalent for one 30-day sprint: $200 for specification, $1,000 for the library, $600 for verification and $400 for the demo, documentation and release package. Scope, award tier, start date and disbursement terms are subject to agreement through the Chapter-led Instaward process.

## 14. Current decision

This is a concrete $2,200 proposal for a small, testable contribution. Its remaining validation questions are whether maintainers and developers want this combined functionality and whether the applicant is ready for the Chapter-led grant process. The next step is to use this brief to resolve those points, then finalize the agreed sprint scope and application.
