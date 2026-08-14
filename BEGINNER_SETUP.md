# ERPClaw Mobile: Beginner Setup Guide

## The Simple Explanation

Think of ERPClaw as two pieces that work together:

| Piece | What it does | Where it runs |
|---|---|---|
| **ERPClaw engine** | Stores your company data and does the accounting work. | A computer or server you control. |
| **ERPClaw Mobile** | Lets you view and send instructions to the engine. | Your Android phone. |

> The mobile app is a **remote control**, not the accounting engine itself. That is why the first screen asks for a gateway address. It is waiting for your computer/server to tell it where the engine lives.

The `https://openclaw.local` text in the app is only an example. Do not use it unless you have personally set up a server with that exact address.

## What You Need

You need one computer in addition to your Android phone. The computer can be a laptop, desktop, or server and should remain on while you use the mobile app. Your phone and computer must be on the **same Wi-Fi network** for the easiest first test.

| Requirement | Beginner choice |
|---|---|
| Computer | Your normal Windows, macOS, or Linux computer |
| Phone connection | Same home/office Wi-Fi as the computer |
| Python | Python 3.11 or newer installed on the computer |
| Two source folders | The upstream ERPClaw engine and this mobile project |

If you use Windows, the simplest route for the commands below is an **Ubuntu WSL terminal**. On macOS or Linux, use the normal Terminal application.

## Step 1: Download the Two Pieces on Your Computer

Open a terminal on your computer and run these commands one at a time:

```bash
git clone https://github.com/avansaber/erpclaw.git ~/erpclaw-engine
git clone https://github.com/dariust2027-pixel/Erpclaw.git ~/erpclaw-mobile
```

The first folder is the real ERP engine. The second folder contains the Android project and the small gateway program that lets the phone communicate with the engine.

## Step 2: Create an Empty ERPClaw Database

Run these commands in the same terminal:

```bash
export ERPCLAW_SOURCE="$HOME/erpclaw-engine"
export ERPCLAW_HOME="$HOME/erpclaw-data"
python3 "$ERPCLAW_SOURCE/scripts/db_query.py" --action initialize-database
```

This creates an **empty** ERPClaw data folder. It does not create a pretend company, invoices, customers, inventory, or demo transactions.

## Step 3: Start the Phone Gateway

Copy this whole block into the terminal. Change the token text to a long secret phrase that only you know.

```bash
export ERPCLAW_SOURCE="$HOME/erpclaw-engine"
export ERPCLAW_HOME="$HOME/erpclaw-data"
export ERPCLAW_GATEWAY_HOST="0.0.0.0"
export ERPCLAW_GATEWAY_PORT="8787"
export ERPCLAW_GATEWAY_TOKEN="change-this-to-a-long-private-secret"
python3 "$HOME/erpclaw-mobile/gateway/erpclaw_gateway.py"
```

Leave this terminal window open. A successful start prints a message similar to:

```text
ERPClaw gateway listening on 0.0.0.0:8787
```

The `0.0.0.0` setting means “allow devices on my private Wi-Fi to contact this computer.” Do **not** use this simple HTTP setup on public Wi-Fi or directly on the public internet.

## Step 4: Find Your Computer’s Wi-Fi Address

You now need the local address of the computer that runs the gateway.

| Computer type | Command | Example answer |
|---|---|---|
| Linux / Ubuntu / WSL | `hostname -I` | `192.168.1.25` |
| macOS | `ipconfig getifaddr en0` | `192.168.1.25` |
| Windows Command Prompt | `ipconfig` | Find the line called `IPv4 Address`, such as `192.168.1.25` |

Write down the number beginning with `192.168`, `10.`, or `172.`. Do **not** use `127.0.0.1`—that means “this same device,” so it would make the phone look for a gateway inside the phone.

## Step 5: Fill in the Mobile App Screen

On the screen in your screenshot, enter the following values:

| Mobile app field | What to enter |
|---|---|
| **Gateway address** | `http://YOUR-COMPUTER-IP:8787` — for example, `http://192.168.1.25:8787` |
| **Access token** | The exact secret phrase you put in `ERPCLAW_GATEWAY_TOKEN` |
| **Private-network HTTP** | Turn this **on** for this same-Wi-Fi test |

Then tap **Connect securely**. Although the button uses the word “securely,” a private-home-network test uses `http://` and the private-network switch. A real internet-facing setup must use HTTPS behind a reverse proxy or VPN.

## Step 6: Make Your First Real Company

If the connection works, the app sees that the engine is empty and offers **Set up my company**. Enter your real company name, abbreviation, country, and currency. Turn on the confirmation switch and tap **Create my company**.

This creates your basic company foundation and a chart of accounts. It does **not** add fake customers, items, payments, invoices, or stock.

## What to Do After Setup

Start slowly. In the app, open **Workspaces** or **Action Center**.

| If you want to… | Start here |
|---|---|
| Add a customer | Home → **New customer** |
| Add an inventory item | Home → **Add inventory item** |
| Create an invoice | Home → **Create invoice** |
| See financial reports | **Reports** tab |
| Use a specialist ERPClaw feature | **Action Center** tab, then search for the action |

The Action Center is intentionally powerful: it exposes the actions published by your engine. Read the name and confirmation message carefully before running a write or high-impact action.

## If “Connect Securely” Does Not Work

Check these simple items in order:

1. The computer terminal is still open and shows the gateway is running.
2. The phone and computer are connected to the same Wi-Fi, not guest Wi-Fi or mobile data.
3. You used `http://COMPUTER-IP:8787`, not `127.0.0.1` and not the example `openclaw.local` address.
4. The **Private-network HTTP** switch is turned on in the app.
5. The token on the phone exactly matches the token in the terminal command.
6. Your computer firewall allows incoming private-network connections on TCP port `8787`.

If the app says “Unauthorized,” the address is probably right but the token is wrong. If it says it cannot reach the gateway, the address, Wi-Fi connection, firewall, or open terminal is usually the problem.

## Important Safety Rule

Do not share your gateway address and access token together. They are the key to your company system. For access away from home/office Wi-Fi, use a properly configured HTTPS reverse proxy or VPN rather than exposing port `8787` directly to the internet.

## References

[1] [ERPClaw upstream engine](https://github.com/avansaber/erpclaw)

[2] [ERPClaw Mobile repository](https://github.com/dariust2027-pixel/Erpclaw)
