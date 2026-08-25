# Multi-Account Social Dashboard

Privacy-first website + Chrome/Edge extension that lets you manage multiple WhatsApp, Facebook, Instagram, X, Discord, Telegram and Google Messages accounts with custom names and one-click switching.

**All data stays in your browser. Zero servers. Zero tracking.**

## Quick Start (Development)

### 1. Load the Extension
1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `extension/` folder
4. Copy the **Extension ID**

### 2. Open the Website
1. Open `website/index.html` in the browser (or serve it with any static server)
2. Paste the Extension ID and click Save
3. Start adding accounts

## Important Limitations
True simultaneous isolated sessions (especially WhatsApp Web) are difficult in a pure open-source Manifest V3 extension because of shared origin storage. This project provides the dashboard + tab management. For full isolation, many users combine it with tools like SessionBox or separate Chrome profiles.

## Privacy
See [privacy-policy.md](privacy-policy.md)

## Project Structure
```
multi-account-social-dashboard/
├── website/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── popup.html
│   └── icons/
└── README.md
```
