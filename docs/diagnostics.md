# Diagnostic meanings

Codes are project-defined API values, not Horizon transaction result codes. `message` and `action` provide human-readable context; integrations should branch on `code`.

| Code                            | Affected party / interpretation                                             | Next action                                         |
| ------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------- |
| `INVALID_INPUT`                 | Application; invalid decimal, address checksum, asset identity, fee or memo | Correct the input.                                  |
| `UNSUPPORTED_PAYMENT`           | Application; payment shape outside this release                             | Use the supported shape or another assessment tool. |
| `NETWORK_MISMATCH`              | Application; provider passphrase differs from intent                        | Select the correct network/provider.                |
| `PROVIDER_TIMEOUT`              | Provider; read exceeded its deadline                                        | Refresh or choose an available provider.            |
| `PROVIDER_RATE_LIMITED`         | Provider; HTTP 429                                                          | Respect the provider’s limits and retry later.      |
| `PROVIDER_UNAVAILABLE`          | Provider; transport exception or non-account HTTP failure                   | Restore provider access and recheck.                |
| `MALFORMED_DATA`                | Provider; incomplete or inconsistent relevant state/metadata                | Fetch complete, consistent state.                   |
| `SOURCE_ACCOUNT_MISSING`        | Sender; account 404                                                         | Activate the account through onboarding.            |
| `DESTINATION_ACCOUNT_MISSING`   | Recipient; account 404                                                      | Arrange recipient activation.                       |
| `SOURCE_TRUSTLINE_MISSING`      | Sender; no exact code+issuer trustline                                      | Establish the correct trustline and fund it.        |
| `DESTINATION_TRUSTLINE_MISSING` | Recipient; no exact code+issuer trustline                                   | Ask recipient to establish the trustline.           |
| `SOURCE_NOT_AUTHORIZED`         | Issuer action needed on sender’s trustline                                  | Ask issuer to authorize payments.                   |
| `DESTINATION_NOT_AUTHORIZED`    | Issuer action needed on recipient’s trustline                               | Ask issuer to authorize payments.                   |
| `INSUFFICIENT_XLM`              | Sender; below payment, reserve, liability and fee requirement               | Reduce amount, add XLM or review offers/entries.    |
| `INSUFFICIENT_ASSET`            | Sender; below amount after selling liabilities                              | Reduce amount, add asset or review offers.          |
| `DESTINATION_CAPACITY_EXCEEDED` | Recipient; amount exceeds capacity after buying liabilities                 | Adjust trustline limit, holdings or buy offers.     |
| `FEE_BUDGET_TOO_LOW`            | Sender; one-operation fee below current network base fee                    | Raise planned fee and refresh.                      |
| `MEMO_REQUIRED`                 | Sender; destination declares SEP-29 memo requirement                        | Obtain the correct memo from the receiving service. |

Missing input/network/provider data or unsupported scope makes the report `incomplete`. Known missing accounts and trustlines are diagnosed issues, not guessed provider outages. Account-dependent checks are not applicable when the account is confirmed missing. A failure can produce multiple diagnostics because reads are independent; one successful read does not cancel another failed read.
