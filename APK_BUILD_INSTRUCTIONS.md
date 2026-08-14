# Android APK Release Instructions

The Android client has passed the source, gateway, export, and clean-data quality gates recorded in `AUDIT_REPORT.md`. The remaining step is the managed Android package build.

## Required Release Action

Open the latest project checkpoint in the project interface and select **Publish**. The managed Android release workflow will build the installable APK from that checkpoint. This route is required because it creates the Android artifact with the managed build environment; the local sandbox export only validates the JavaScript bundle and does not replace an installable APK.

| Before publishing | Confirmed state |
|---|---|
| Application name | ERPClaw Mobile |
| Android package | `com.app.erpclawandroid` |
| Icon, splash, favicon, adaptive foreground | Custom ERPClaw icon installed |
| Orientation | Portrait |
| Build validation | Android export passed |
| Data behavior | Clean first-run; no auto-created company or demo data |

## First Production Connection

Run the provided `gateway/erpclaw_gateway.py` next to a trusted ERPClaw installation. Set `ERPCLAW_SOURCE`, `ERPCLAW_HOME`, and a long random `ERPCLAW_GATEWAY_TOKEN`; publish the gateway only through HTTPS or a private VPN. Then install the APK and use the connection screen to enter the gateway URL and token. The application will show an empty-business setup screen unless the connected engine already has company records.

> Disconnecting the app clears only the saved endpoint and token from that device. It does not delete any remote company or accounting data.
