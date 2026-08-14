# ERPClaw Mobile: What Runs Where and How Everything Fits Together

## The One-Sentence Answer

**Yes, ERPClaw must run somewhere outside the phone.** The Android app is the screen and remote control; the original ERPClaw project is the accounting engine; and the included gateway is the secure translator between them.

> A useful analogy is a restaurant. The Android app is the menu and waiter, the gateway is the order window, and ERPClaw is the kitchen and accounting office. The menu cannot cook the food by itself.

## The Four Pieces

| Piece | What it is | Where it runs | Included in `dariust2027-pixel/Erpclaw`? |
|---|---|---|---|
| **ERPClaw engine** | The original Python accounting and business engine. It owns companies, ledgers, invoices, inventory, payroll, reports, and business rules. | A computer or server you control. | **No.** Clone/install it separately from the upstream repository. |
| **ERPClaw gateway** | A small Python adapter that turns secure phone requests into approved ERPClaw engine actions. | The **same computer/server** as the ERPClaw engine. | **Yes**: `gateway/erpclaw_gateway.py`. |
| **ERPClaw Mobile** | The Android app. It asks for a gateway address, shows your ERP data, and sends actions after confirmation. | Your Android phone. | **Yes**: the Expo/React Native app source and APK workflow. |
| **Template Backend Service** | A generic Node-based service provided by the project template for optional web/mobile features. | Managed application hosting. | Present, but **not used as the ERPClaw Python engine**. |

The **“Backend Service — Live”** card shown in the publishing screen refers to the fourth item. It is not a hosted copy of the original ERPClaw engine and it does not make your phone app usable by itself.

## What the Original ERPClaw Repository Does

The upstream project at [avansaber/erpclaw](https://github.com/avansaber/erpclaw) is the actual ERP system. Its Python router handles the accounting and operational rules for general ledger, customers, suppliers, sales, buying, inventory, payments, billing, taxes, payroll, advanced accounting, reporting, and industry modules. It can store data using SQLite or PostgreSQL and is designed to be self-hosted.[1]

Its normal primary experience is an AI-agent/command interface. The engine routes work through `scripts/db_query.py --action ...`, validates accounting invariants, and then stores the authoritative result. It is **not an Android application**.[1]

## What We Built

This project does **not replace** ERPClaw. It adds a practical Android client around it.

| Capability | Original ERPClaw | ERPClaw Mobile project |
|---|---|---|
| Accounting engine and database | Yes | No; it delegates to ERPClaw. |
| Android user interface | No | Yes. |
| Clean company setup | Engine accepts setup actions | Mobile flow asks for explicit user confirmation and never adds demo records. |
| Full action coverage | Engine publishes its action catalog | Mobile **Action Center** discovers the catalog and provides a safe action form for each published action. |
| Secure phone-to-engine connection | No mobile HTTP interface by default | Included Python gateway with bearer-token checks and action allow-listing. |
| Gateway server | No | Yes: `gateway/erpclaw_gateway.py`. |
| Installable Android APK | No | Yes: GitHub Actions builds a standalone APK with the JavaScript bundle inside it. |

The mobile app does not maintain a second ledger and does not calculate balances on its own. It displays results returned by the original engine. This is deliberate: the real ERP database remains in one controlled place.

## What Has Already Been Pushed to Your GitHub Repository

The published repository contains all of the **mobile-side** pieces required to build and connect the app:

| Repository path | Purpose |
|---|---|
| `app/`, `components/`, `contexts/`, `lib/` | Android mobile interface, connection flow, Action Center, reports, onboarding, and settings. |
| `gateway/erpclaw_gateway.py` | The Python gateway that runs next to the original ERPClaw engine. |
| `gateway/README.md` | Short gateway reference. |
| `BEGINNER_SETUP.md` | Copy-paste beginner guide for first local setup. |
| `.github/workflows/android-apk.yml` | Builds the standalone Android APK from GitHub Actions. |
| `ARCHITECTURE_AND_DEPLOYMENT.md` | This explanation. |

The original ERPClaw source is intentionally **not copied** into your repository. Keeping it separate makes upgrades, licensing, security updates, and responsibility clear. You point the gateway at the original engine using the `ERPCLAW_SOURCE` environment variable.

## A-to-Z: First Working Setup on Your Own Computer

This is the simplest path. It is for a test on your own Wi-Fi, not public internet use.

### A. Install the tools on the computer

You need a computer that stays switched on while the phone uses the app. Install Git and Python 3.11 or newer. On Windows, use WSL Ubuntu for the commands below; on macOS or Linux, use Terminal.

### B. Clone the original ERPClaw engine

```bash
git clone https://github.com/avansaber/erpclaw.git ~/erpclaw-engine
```

This folder contains the real business/accounting system.

### C. Clone your mobile repository

```bash
git clone https://github.com/dariust2027-pixel/Erpclaw.git ~/erpclaw-mobile
```

This folder contains the Android project and gateway adapter.

### D. Create an empty business database

```bash
export ERPCLAW_SOURCE="$HOME/erpclaw-engine"
export ERPCLAW_HOME="$HOME/erpclaw-data"
python3 "$ERPCLAW_SOURCE/scripts/db_query.py" --action initialize-database
```

This makes a blank ERP system. It does not create a demo company, customers, invoices, or inventory.

### E. Start the gateway

Choose a long private token. Do not use the example token below in real use.

```bash
export ERPCLAW_SOURCE="$HOME/erpclaw-engine"
export ERPCLAW_HOME="$HOME/erpclaw-data"
export ERPCLAW_GATEWAY_HOST="0.0.0.0"
export ERPCLAW_GATEWAY_PORT="8787"
export ERPCLAW_GATEWAY_TOKEN="replace-this-with-a-long-private-secret"
python3 "$HOME/erpclaw-mobile/gateway/erpclaw_gateway.py"
```

Leave this terminal open. The gateway should say it is listening on port `8787`.

### F. Find the computer’s local Wi-Fi address

| Computer | Command | Example address |
|---|---|---|
| Linux / Ubuntu / WSL | `hostname -I` | `192.168.1.25` |
| macOS | `ipconfig getifaddr en0` | `192.168.1.25` |
| Windows Command Prompt | `ipconfig` | Look for `IPv4 Address`, such as `192.168.1.25` |

Use the address starting with `192.168`, `10.`, or `172.`. Do not use `127.0.0.1`: that means “this computer only,” and your phone is a different device.

### G. Connect the phone

Make sure the phone and computer use the same non-guest Wi-Fi network. In ERPClaw Mobile enter:

| Phone field | Value |
|---|---|
| **Gateway address** | `http://YOUR-COMPUTER-IP:8787`, for example `http://192.168.1.25:8787` |
| **Access token** | The exact private token from Step E |
| **Private-network HTTP** | **On**, for this private Wi-Fi test only |

Tap **Connect securely**. The app then checks the gateway, asks the engine for its action catalog, and asks whether a company already exists.

### H. Create your real company

If the engine is empty, tap **Set up my company**. Enter your real business name, country, currency, and other details. The app asks for confirmation before it creates the company foundation. It does not add fake commercial data.

### I. Start using it

Use **Home** for common actions, **Workspaces** for functional areas, **Reports** for engine-calculated reports, and **Action Center** for the complete catalog exposed by the engine.

## Where You Should Run ERPClaw Long-Term

| Situation | Recommended place to run engine + gateway | Phone connection |
|---|---|---|
| Learning / first test | Your laptop on the same Wi-Fi | `http://LAN-IP:8787` with private-network HTTP enabled |
| One-person home/office use | A small always-on Linux machine or NAS you control | Private Wi-Fi or VPN |
| Team / outside-office use | A managed Linux server or company server with backups, TLS, firewall, and VPN or reverse proxy | `https://your-company-domain.example` |

Do not expose raw port `8787` directly to the public internet. For outside-network access, put the gateway behind HTTPS with a reverse proxy or use a VPN. Treat the database and gateway token like financial-system credentials.

## What Is Not Included Yet

The repository includes the gateway **program**, but it cannot automatically run a Python service forever inside the Android phone or inside the generic template backend. You must choose and operate the computer/server where the original ERPClaw engine and gateway live. A production rollout also needs backups, operating-system updates, a gateway token policy, and secure remote access.

## Quick Troubleshooting

| App message | Most likely meaning | First thing to check |
|---|---|---|
| Cannot reach gateway | Phone cannot contact the computer/server | Same Wi-Fi, correct IP, terminal still running, firewall port 8787 |
| Unauthorized | Phone reached the gateway but token differs | Copy the exact token from the gateway command |
| Empty business | This is expected on first setup | Create your real company deliberately |
| Connection works at home only | The gateway is only on local Wi-Fi | Use HTTPS/VPN for remote access; do not open port 8787 publicly |

## References

[1] [ERPClaw upstream repository and documentation](https://github.com/avansaber/erpclaw)

[2] [ERPClaw Mobile repository](https://github.com/dariust2027-pixel/Erpclaw)
