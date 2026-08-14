# ERPClaw Android — Product and Interface Design

## Product Definition and Integration Boundary

ERPClaw Android is a **mobile control plane for a self-hosted ERPClaw engine**. The upstream project is a Python-based local ERP router, not an Android application. The mobile client therefore never recreates bookkeeping rules, maintains a parallel ledger, or invents business records. Instead, it connects over HTTPS to a small ERPClaw action gateway that invokes the upstream engine and returns structured results. This preserves the upstream engine as the system of record while allowing its action catalog to remain accessible from Android.

> The client must never preload a company, chart of accounts, customer, supplier, item, invoice, or demo transaction. A new installation has an unconfigured connection state; once connected to a fresh engine, it displays an empty-business onboarding state until the owner deliberately creates a company.

The first release will include native, task-oriented journeys for the highest-frequency workflows and a secure **Action Center** that can render and execute every action published by the connected engine catalog. This provides complete catalog reach without pretending that hundreds of specialist workflows can be safely represented as one hard-coded form set.

| Layer | Responsibility | Explicitly excluded |
|---|---|---|
| Android client | Connection setup, secure credential storage, catalog discovery, action form rendering, read-only dashboards, confirmation, response presentation, local UI preferences | Ledger calculation, background posting, locally fabricated data |
| ERPClaw action gateway | Authenticates the client, validates request shape, exposes the engine catalog and action execution over HTTPS, forwards calls to the official Python router | Re-implementing accounting rules or mutating the database directly |
| ERPClaw engine | Database initialization, business validation, double-entry posting, audit logging, reports, module management, data persistence | Mobile presentation |

## Screen List and Primary Content

All designs assume a **9:16 portrait screen**, thumb-reachable primary actions in the lower half of the viewport, one main decision per screen, and native-safe spacing for Android devices. Interaction patterns follow familiar iOS/Android conventions: top-level navigation, clear titles, grouped lists, sheets for short tasks, destructive-action confirmation, visible progress, and accessible touch targets.

| Screen | Primary content | Functionality |
|---|---|---|
| Launch and connection check | Brand mark, connection status, privacy statement | Restores encrypted endpoint/token; validates gateway health before navigating |
| Connect ERPClaw | HTTPS gateway URL, optional bearer token, certificate/privacy note | Validates endpoint; stores configuration only after a successful health response |
| First-run business setup | Empty state, company name, country/region, fiscal year, industry selector | Creates a company only after explicit confirmation; no default company is inserted |
| Home | Current company selector, connection status, quick actions, finance/inventory status cards | Routes to invoice, payment, customer, item, report, or catalog; displays unknown/loading states rather than mock figures |
| Action Center | Searchable catalog grouped by domain, safety labels, recent actions | Provides access to the full discovered upstream action catalog and action descriptions |
| Action form | Engine-provided arguments, typed inputs, inline validation, confirmation sheet | Executes read-only actions immediately; requires deliberate confirmation for write and destructive classes |
| Result and audit receipt | Business-friendly outcome, structured details, error guidance, reference identifiers | Enables copying/exporting result data, returning to the relevant entity list, and viewing safe action history |
| Workspaces | Sales, Buying, Inventory, Finance, People, Billing, Advanced, Administration | Curated entry points into corresponding catalog actions and reports; no static records |
| Lists and record detail | Remote paginated records and documents | Reads official engine results; provides create/open/cancel actions according to returned capability and permissions |
| Reports | Trial balance, P&L, balance sheet, cash flow, aging, dimensional reports | Runs report actions with date/dimension filters; formats results but never recomputes accounting values |
| Settings and security | Connection profile, biometric/lock preference, clear local configuration, diagnostics | Manages local encrypted config and disconnect; clearing configuration does not delete the remote business database |

## Key User Flows

### Clean First Run

1. The user opens the application and sees **“Connect your ERPClaw engine”**, not a populated dashboard.
2. The user enters the HTTPS address of their gateway and, if required, a token.
3. The client calls the health and catalog endpoints. It does not call data-seed operations.
4. If the connected engine has no company, the client opens the business setup flow. Otherwise, it opens the company selector.
5. The user explicitly completes company setup. Only then can operational workspace actions become available.

### Create and Send an Invoice

1. The user selects **Sales** from the workspace list or the lower quick-action region.
2. The app reads customers and items from the engine, presenting search results and empty states where applicable.
3. The user enters the customer, line items, quantities, and pricing; the app validates only format-level input.
4. The app presents a confirmation sheet that summarizes the business outcome.
5. The gateway invokes the appropriate upstream action. The client renders the authoritative result and provides a receipt/reference.

### Run Any Supported Engine Action

1. The user opens **Action Center** and searches or filters a discovered action.
2. The client loads the action description and expected arguments from the gateway.
3. The user completes the adaptive form. The client blocks malformed inputs and explains missing fields.
4. Read-only work runs directly. Any action that changes business data displays a confirmation sheet; destructive actions require the user’s explicit second confirmation.
5. The app displays a normalized success or failure receipt and saves only a local, redacted history entry.

### Disconnect and Remove Local Data

1. The user opens **Settings** and selects **Disconnect from ERPClaw**.
2. The app states precisely that the action removes the saved endpoint, token, and local UI settings only.
3. After confirmation, the application deletes encrypted local configuration and returns to the connection screen. It does not invoke a remote reset or delete action.

## Navigation and Information Architecture

The primary navigation uses five portrait-first tabs: **Home**, **Workspaces**, **Action Center**, **Reports**, and **Settings**. The home screen supports immediate tasks, while the Action Center guarantees catalog completeness. Detail screens are pushed on the navigation stack, and write confirmations use bottom sheets so the user retains context.

| Tab | Purpose | One-handed priority |
|---|---|---|
| Home | Company context, quick actions, status | High-frequency tasks placed in lower content area |
| Workspaces | Curated functional domains | Single-column list with large row targets |
| Action Center | Full action catalog access | Search pinned near top, results optimized for thumb scrolling |
| Reports | Financial and operational outputs | Preset date filters and compact parameter controls |
| Settings | Connection and local security | Low-frequency, separated from operational actions |

## Visual System

The brand uses a sober, data-forward accounting aesthetic rather than decorative fintech styling. The palette remains readable in bright warehouses, offices, and low-light review sessions.

| Token | Light value | Dark value | Purpose |
|---|---:|---:|---|
| Primary | `#0D5C5A` | `#54C6BB` | ERPClaw teal for primary actions and active states |
| Background | `#F6F8F7` | `#101716` | Calm neutral base that reduces visual noise |
| Surface | `#FFFFFF` | `#17211F` | Cards, lists, sheets, and grouped controls |
| Foreground | `#17201E` | `#E7F0ED` | High-contrast primary content |
| Muted | `#64716C` | `#A7B3AE` | Secondary labels and timestamps |
| Border | `#D9E2DE` | `#30403B` | Group separation and control boundaries |
| Success | `#177B50` | `#5DCB91` | Completed business actions |
| Warning | `#9C6612` | `#F2BE62` | Attention and pending status |
| Error | `#B62D3A` | `#FF8991` | Failure and destructive states |

Typography uses platform system fonts and semantic type scale: a 28-point screen title, 20-point section title, 17-point primary row text, and 14–15-point supporting labels. Actions have minimum 44×44 point hit areas. Critical states use color plus a textual label and icon, never color alone.

## Acceptance Criteria and Audit Gates

| Area | Acceptance criterion |
|---|---|
| Clean start | A new install contains no preset company or operational data and displays the connection/onboarding state.
| Data integrity | The client does not write directly to a ledger database or produce calculated accounting balances locally.
| Coverage | Every action exposed by the connected engine catalog is discoverable and can be inspected from Action Center; executable action forms are rendered from catalog metadata.
| Safety | Mutating actions require an explicit confirmation; destructive actions require a second explicit confirmation; tokens are stored in secure storage.
| Resilience | Offline, timeout, invalid-token, invalid-input, and engine-error states have human-readable recovery guidance.
| Accessibility | Labels, focus order, sufficient text contrast, readable type scaling, and non-color-only state indicators are verified.
| Release | Type check, lint, unit tests, gateway contract tests, Android build validation, and clean-install verification must pass before APK delivery.

## Delivery Constraint

The APK can be built and installed on Android, but it cannot contain the upstream Python engine in this Expo client. A functional production setup needs the companion ERPClaw action gateway running wherever the user hosts ERPClaw. The client will provide a testable connector and clear setup instructions; it will not claim to provide an offline, full accounting engine when no such service is available.
