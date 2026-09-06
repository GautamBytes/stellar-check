# Four read-only testnet scenarios

`npm run testnet` performs four fresh readiness checks and writes `artifacts/testnet-results.json`. It never requests private keys or constructs, signs or submits executable transactions. The memo adapter only constructs an unsigned container for the SDK’s memo inspection.

The included `examples/testnet-accounts.json` names public accounts observed in recent testnet payments during implementation. They are not project-owned accounts, endorsements or pilot integrations. Their state can change; testnet resets invalidate them. The command exits nonzero if any expected outcome cannot be reproduced, rather than silently accepting different results.

## Supply repeatable accounts

For longer-lived development, use testnet accounts you control. Create/fund accounts and establish trustlines through your normal testnet setup outside this library. Keep private keys outside this project. Supply this public-only JSON shape:

```json
{
  "nativeSource": "funded source G address",
  "nativeDestination": "different existing G address",
  "creditSource": "funded holder G address",
  "creditDestination": "different authorized holder G address with capacity",
  "creditCode": "USD",
  "creditIssuer": "issuer G address, distinct from both holders",
  "missingTrustlineDestination": "existing G address without this exact trustline"
}
```

Both valid-payment destinations must have no memo declaration, since these scenarios intentionally omit a memo. Credit source requires positive available asset balance and sufficient XLM for reserve plus fee. The recipient must have at least one stroop of remaining authorized capacity. Accounts must be ordinary G accounts.

```sh
npm run testnet -- /absolute/path/testnet-accounts.json
```

| Scenario                    | Construction                                                             | Expected report                                 |
| --------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------- |
| Valid XLM                   | Send one stroop between existing funded accounts                         | `no_known_issues`                               |
| Valid issued asset          | Send one stroop between two ordinary authorized holders                  | `no_known_issues`                               |
| Missing recipient trustline | Same asset source; change destination to account lacking exact trustline | `issues_found`, `DESTINATION_TRUSTLINE_MISSING` |
| Insufficient availability   | Native payment amount set above observed source native balance           | `issues_found`, `INSUFFICIENT_XLM`              |

The fee budget comes from the current testnet ledger. The script checks the provider’s passphrase against `Networks.TESTNET` even if `HORIZON_URL` is overridden. Output contains full reports, public payment intents, observation timestamps and `transactionsSubmitted: 0`.

Historical verification evidence is saved in `docs/verification/testnet-2026-09-06.json`. It demonstrates the observed outcomes at those times, not permanent account readiness. Liability, capacity, sponsorship and memo edge cases remain controlled automated fixtures.
