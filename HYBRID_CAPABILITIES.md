# Hybrid Offline-Sync ERP Branch

This branch provides offline company setup, local customers, local inventory items, local invoice drafts, and an explicit outbox. It requires no connection to start work. When a user configures an ERPClaw gateway, the app checks the gateway catalog and sends queued actions individually with the same confirmed-action contract used by the connected app.

| Preserved in this branch | Boundary to understand |
|---|---|
| Offline local work, encrypted gateway credential storage, live catalog discovery, queued `setup-company`, `add-customer`, `add-item`, and `create-sales-invoice` actions, manual sync, visible failed-action conflicts, local cached report snapshot | The original ERPClaw engine remains the authority for complete server reports, tax/payroll/advanced accounting modules, permissions, and complex conflict resolution. Failed remote actions remain visible rather than being silently forced. |

> Hybrid mode keeps work durable when offline and keeps the original engine/agent capabilities available whenever a secure gateway is online.
