# Privacy Policy – Multi-Account Social Dashboard

**Last updated:** August 2026

This project consists of a static website and a browser extension. Both are designed with a strict privacy-first architecture.

## Data Collection

We collect **zero** personal data.

- No analytics
- No tracking pixels
- No cookies set by the website
- No telemetry
- No servers controlled by the developers receive any information from the website or extension

## Where Data Lives

- **Website**: Account names, platform choices and order are stored exclusively in the browser’s `localStorage`.
- **Extension**: Account metadata and optional session helpers are stored in `chrome.storage.local` (local to your browser profile).

You can export or permanently delete all local data at any time from the dashboard.

## Permissions

The extension requests:
- `storage` – to remember which accounts you created
- `tabs` – to open / focus the correct messaging web apps
- `cookies` & `browsingData` – optional best-effort session helpers (not required for basic open/focus functionality)
- Host permissions for the listed messaging domains so it can open them

None of this data is transmitted anywhere.

## Contact

Because no data is collected, there is nothing to request or delete from us. All control remains on your device.

This software is provided as-is. Review the source code yourself – it is intentionally small and auditable.
