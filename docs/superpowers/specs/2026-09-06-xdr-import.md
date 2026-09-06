# XDR import and actionable issues

Approved scope: import an unsigned transaction, inspect decoded payment values, load the checker and follow actionable diagnostics. Version stays v0.1.0. Recheck comparison and generated integration snippets remain separate ideas and are not part of this change.

The public importPaymentXdr helper returns a discriminated result, with a validated PaymentIntent and unassessed envelope context on success. It uses the pinned SDK locally, requires explicit network selection, bounds input size and enforces canonical serialization. Signed transactions, V0 envelopes, fee bumps, extensions, V2 preconditions and unsupported payment shapes are rejected. It preserves exact amount/fee values, memo IDs, hash bytes and lossless UTF-8 text, including BOMs. Time bounds and sequence are shown without a readiness claim.

The collapsible importer uses the existing neutral surfaces, violet/blue theme accents and touch targets. Preview changes invalidate the pending import. Loading an import switches the form to live mode, clears stale reports, shows a persistent scope notice and focuses the payment heading. No network fetch occurs until an explicit check. Edits never modify the original XDR.

Issue actions focus the relevant editable field, opening fee/memo settings when needed. External trustline/authorization actions offer copyable exact asset and account details. No action signs, submits, creates account state or guesses memo contents.
