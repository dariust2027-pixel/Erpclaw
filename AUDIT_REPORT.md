# ERPClaw Mobile — Functional and Release Audit

**Audit date:** 14 August 2026  
**Scope:** ERPClaw Mobile Android client, companion self-hosted action gateway, clean first-run behavior, and the upstream ERPClaw engine boundary.

## Executive Summary

The mobile client has been rebuilt as a secure Android control plane for the upstream ERPClaw engine. The original source repository is an ERP engine and OpenClaw skill rather than an Android project; it has no native APK, Expo, Gradle, or mobile UI source. The implementation therefore preserves the Python engine as the authoritative ledger and exposes its live action catalog through a self-hosted HTTP gateway. The Action Center dynamically discovers all actions made available by the connected engine while native screens prioritize the highest-frequency workflows.

The initial failure mode—preloaded company data and unusable interactions—was addressed by removing all automatic business seeding. A fresh connection now begins with no company records. The user must explicitly connect a gateway and deliberately confirm the company setup flow. The gateway excludes the upstream `seed-demo-data` action from its catalog and the standard onboarding flow creates only company, baseline preference, and chart-of-accounts records. [1]

| Release area | Result | Evidence |
|---|---|---|
| TypeScript compilation | Passed | `pnpm check` completed with no errors. |
| Linting | Passed | `pnpm lint` completed. One non-blocking Node module-type warning remains in the template lint configuration. |
| Mobile client tests | Passed | Six ERPClaw-specific Vitest checks passed; one unrelated template logout test remains intentionally skipped. |
| Gateway contract tests | Passed | Three Python tests passed against a fresh temporary ERPClaw database. |
| Clean-first-run validation | Passed | A freshly initialized engine had zero companies. After user-confirmed setup, customers, suppliers, items, sales invoices, purchase invoices, and payments all remained at zero. |
| Gateway security checks | Passed | Bearer-token rejection, catalog demo-seed exclusion, and CORS allow-list behavior were verified. |
| Upstream engine regression suite | Passed | `158 passed, 9 skipped` after recreating the project’s documented CI source-path layout. |
| Android bundle export | Passed | Expo exported a 4.21 MB Android JavaScript bundle and metadata successfully. |
| Native APK artifact | Pending platform build | The managed publishing workflow must create the installable APK after this checkpoint. |

## Implementation Findings and Resolutions

The following findings were fixed before release validation.

| Finding | Risk | Resolution |
|---|---|---|
| The supplied repository had no Android application | A non-functional wrapper or misleading APK could have been produced | Built a dedicated Expo Android client and documented the server boundary. |
| Company/demo data could be present before consent | User could unknowingly operate against fake or wrong business records | Added a clean connection state, explicit company-creation confirmation, and tests proving an empty operational dataset. |
| Demo-data action was visible in the engine catalog | A user could seed sample records from the mobile UI | The gateway filters `seed-demo-data` out of the catalog and rejects it at the gateway boundary. |
| Credentials needed device protection | Gateway token exposure could permit unauthorized accounting actions | Endpoint metadata is kept in local preferences and the small bearer token is stored through SecureStore/Android Keystore. |
| Any catalog action could represent a material business change | Accidental posting or high-impact action execution | Read, write, and high-impact actions are classified. Write actions require confirmation; high-impact actions receive a second confirmation. |
| Browser-origin defaults could be overly permissive | Cross-origin web callers could obtain unintended access | CORS headers are now emitted only for exact origins listed in `ERPCLAW_ALLOWED_ORIGINS`. |
| Launcher assets were placeholders | Release APK would not carry product branding | Added the custom ERPClaw icon to the Android launcher, adaptive foreground, splash, and favicon assets. |

## Functional Coverage

The app has a clean first-run connection screen, explicit business onboarding, home dashboard, business-domain workspaces, reports, Action Center, result receipts, and connection/security settings. The dynamic Action Center uses the action catalog emitted by the connected engine and therefore remains aligned with installed ERPClaw modules without hard-coding a partial action list. Curated report entry points are provided for trial balance, profit and loss, balance sheet, cash flow, AR aging, and AP aging.

> The application intentionally does not calculate ledger values locally or write directly to the ERP database. Every business action passes through the official ERPClaw router, preserving the engine’s validation, transactional behavior, audit logging, and accounting controls. [1]

## Verified Clean Setup Sequence

The following controlled sequence was executed against a disposable database through the same HTTP gateway used by the mobile client. The test company is isolated from all user data and has been left outside the released application.

| Step | Result |
|---|---|
| Initialize database | Created 215 tables, 615 indexes, 22 registered skills, and no company records. |
| Create explicitly confirmed company | Created exactly one company, fiscal year, cost center, and warehouse. |
| Seed baseline defaults | Added 16 currencies, 14 units of measure, and 6 payment terms; no business transactions. |
| Create US GAAP chart | Added 94 accounts for the created company. |
| Verify operational masters/documents | Customers, suppliers, items, sales invoices, purchase invoices, and payments each returned a zero count. |

## Release Boundary and Known Operational Requirement

The Android APK is a client for a self-hosted ERPClaw engine. It cannot embed and silently execute the upstream Python runtime within the Expo app. To use real ERP data, deploy `gateway/erpclaw_gateway.py` on or near the trusted ERPClaw host, protect it with TLS and a strong bearer token, then enter its HTTPS address in the mobile app. The application accepts plain HTTP only when the user deliberately enables the private-network option for a local development gateway.

The included gateway is intentionally conservative. It exposes only actions currently advertised by ERPClaw, filters demo data seeding, builds a subprocess argument vector rather than a shell command, carries user confirmation through to the engine, caps request body size, limits each engine action to 90 seconds, and avoids logging request bodies or credentials.

## References

[1]: https://github.com/avansaber/erpclaw "ERPClaw upstream repository"
